import { type CourseModality, type CourseSearchCriteria, type CourseSearchPage, type CourseSortField, type CourseStatus, isCourseModality, isCourseSortField, isCourseStatus } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

const INVALID_QUERY_CODE = 'INVALID_QUERY_PARAMETER' as const;
const INVALID_QUERY_MESSAGE = 'One or more query parameters are invalid.';

interface CourseQueryErrorDetail {
	readonly field: string;
	readonly message: string;
}

export interface CourseQueryErrorBody {
	readonly error: {
		readonly code: typeof INVALID_QUERY_CODE;
		readonly message: typeof INVALID_QUERY_MESSAGE;
		readonly details: CourseQueryErrorDetail[];
	};
}

export type CourseSearchOutcome = { ok: true; body: CourseSearchPage } | { ok: false; body: CourseQueryErrorBody };

export const findCourses =
	(dataSources: DataSources) =>
	async (queryString: string): Promise<CourseSearchOutcome> => {
		const parsed = parseCourseSearch(queryString);
		if (!parsed.ok) {
			return parsed;
		}
		const body = await dataSources.readonlyDataSource.course.search(parsed.query);
		return { ok: true, body };
	};

type ParsedCourseSearch = { ok: true; query: CourseSearchCriteria } | { ok: false; body: CourseQueryErrorBody };

type OptionalValue = { kind: 'absent' } | { kind: 'invalid' } | { kind: 'value'; value: string };

function parseCourseSearch(queryString: string): ParsedCourseSearch {
	const params = new URLSearchParams(queryString);
	const details: CourseQueryErrorDetail[] = [];
	const query: {
		q?: string;
		modality?: CourseModality;
		status?: CourseStatus;
		tag?: string;
		page: number;
		pageSize: number;
		sort: CourseSortField;
	} = {
		page: 1,
		pageSize: 10,
		sort: 'title',
	};

	const supported = new Set(['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort']);
	const unknown: string[] = [];
	for (const key of params.keys()) {
		if (!supported.has(key) && !unknown.includes(key)) {
			unknown.push(key);
		}
	}
	unknown.sort((left, right) => compareText(left, right));
	for (const field of unknown) {
		details.push({ field, message: `${field} is not a supported query parameter.` });
	}

	const q = readParam(params, 'q', details);
	if (q.kind === 'value' && q.value.length > 0) {
		query.q = q.value;
	}

	const modality = readParam(params, 'modality', details);
	if (modality.kind === 'value') {
		if (isCourseModality(modality.value)) {
			query.modality = modality.value;
		} else {
			details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		}
	}

	const status = readParam(params, 'status', details);
	if (status.kind === 'value') {
		if (isCourseStatus(status.value)) {
			query.status = status.value;
		} else {
			details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		}
	}

	const tag = readParam(params, 'tag', details);
	if (tag.kind === 'value' && tag.value.length > 0) {
		query.tag = tag.value;
	}

	const page = readParam(params, 'page', details);
	if (page.kind === 'value') {
		if (/^[1-9]\d*$/.test(page.value)) {
			query.page = Number(page.value);
		} else {
			details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		}
	}

	const pageSize = readParam(params, 'pageSize', details);
	if (pageSize.kind === 'value') {
		if (/^[1-9]\d*$/.test(pageSize.value)) {
			const parsed = Number(pageSize.value);
			if (parsed <= 50) {
				query.pageSize = parsed;
			} else {
				details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
			}
		} else {
			details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		}
	}

	const sort = readParam(params, 'sort', details);
	if (sort.kind === 'value') {
		if (isCourseSortField(sort.value)) {
			query.sort = sort.value;
		} else {
			details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		}
	}

	if (details.length > 0) {
		return {
			ok: false,
			body: {
				error: {
					code: INVALID_QUERY_CODE,
					message: INVALID_QUERY_MESSAGE,
					details,
				},
			},
		};
	}

	return { ok: true, query };
}

function readParam(params: URLSearchParams, field: string, details: CourseQueryErrorDetail[]): OptionalValue {
	const values = params.getAll(field);
	if (values.length === 0) {
		return { kind: 'absent' };
	}
	if (values.length > 1) {
		details.push({ field, message: `${field} must be provided at most once.` });
		return { kind: 'invalid' };
	}
	const value = values[0];
	if (value === undefined) {
		details.push({ field, message: `${field} must be provided at most once.` });
		return { kind: 'invalid' };
	}
	return { kind: 'value', value };
}

function compareText(left: string, right: string): number {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}
