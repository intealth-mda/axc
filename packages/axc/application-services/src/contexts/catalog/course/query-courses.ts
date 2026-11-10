import type { Course, CourseSearchCriteria, CourseSearchResult, CourseSort } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

const MODALITIES = ['online', 'in-person', 'hybrid'] as const;
const STATUSES = ['draft', 'active', 'retired'] as const;
const SORTS = ['title', 'createdAt', 'updatedAt'] as const;

type Modality = (typeof MODALITIES)[number];
type Status = (typeof STATUSES)[number];

export interface RawCourseQuery {
	readonly q?: string;
	readonly modality?: string;
	readonly status?: string;
	readonly tag?: string;
	readonly page?: string;
	readonly pageSize?: string;
	readonly sort?: string;
}

export interface CourseItem {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: string;
	readonly status: string;
	readonly tags: string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CoursePage {
	readonly items: CourseItem[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export interface CourseQueryErrorDetail {
	readonly field: string;
	readonly message: string;
}

export interface CourseQueryErrorBody {
	readonly error: {
		readonly code: 'INVALID_QUERY_PARAMETER';
		readonly message: 'One or more query parameters are invalid.';
		readonly details: CourseQueryErrorDetail[];
	};
}

interface ParsedCourseQuery {
	readonly q?: string;
	readonly modality?: Modality;
	readonly status?: Status;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSort;
}

type ParseResult = { readonly ok: true; readonly value: ParsedCourseQuery } | { readonly ok: false; readonly details: readonly CourseQueryErrorDetail[] };

export class InvalidCourseQueryError extends Error {
	readonly details: readonly CourseQueryErrorDetail[];

	constructor(details: readonly CourseQueryErrorDetail[]) {
		super('One or more query parameters are invalid.');
		this.name = 'InvalidCourseQueryError';
		this.details = details;
	}
}

export function courseQueryErrorBody(details: readonly CourseQueryErrorDetail[]): CourseQueryErrorBody {
	return {
		error: {
			code: 'INVALID_QUERY_PARAMETER',
			message: 'One or more query parameters are invalid.',
			details: details.map((detail) => ({ field: detail.field, message: detail.message })),
		},
	};
}

function isModality(value: string): value is Modality {
	return (MODALITIES as readonly string[]).includes(value);
}

function isStatus(value: string): value is Status {
	return (STATUSES as readonly string[]).includes(value);
}

function isSort(value: string): value is CourseSort {
	return (SORTS as readonly string[]).includes(value);
}

function parseBoundedInteger(value: string, minimum: number, maximum: number): number | undefined {
	if (!/^[1-9]\d*$/.test(value)) {
		return undefined;
	}
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
		return undefined;
	}
	return parsed;
}

function parseCourseQuery(raw: RawCourseQuery): ParseResult {
	const details: CourseQueryErrorDetail[] = [];
	let modality: Modality | undefined;
	let status: Status | undefined;
	let tag: string | undefined;
	let q: string | undefined;

	if (raw.modality !== undefined) {
		const value = raw.modality.trim();
		if (!isModality(value)) {
			details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		} else {
			modality = value;
		}
	}

	if (raw.status !== undefined) {
		const value = raw.status.trim();
		if (!isStatus(value)) {
			details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		} else {
			status = value;
		}
	}

	if (raw.tag !== undefined) {
		const value = raw.tag.trim();
		if (value.length === 0) {
			details.push({ field: 'tag', message: 'tag must be a non-empty string.' });
		} else {
			tag = value;
		}
	}

	if (raw.q !== undefined) {
		const value = raw.q.trim();
		if (value.length > 0) {
			q = value;
		}
	}

	const page = raw.page === undefined ? 1 : parseBoundedInteger(raw.page.trim(), 1, Number.MAX_SAFE_INTEGER);
	if (page === undefined) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
	}

	const pageSize = raw.pageSize === undefined ? 10 : parseBoundedInteger(raw.pageSize.trim(), 1, 50);
	if (pageSize === undefined) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
	}

	let sort: CourseSort = 'title';
	if (raw.sort !== undefined) {
		const value = raw.sort.trim();
		if (!isSort(value)) {
			details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		} else {
			sort = value;
		}
	}

	if (details.length > 0 || page === undefined || pageSize === undefined) {
		return { ok: false, details };
	}

	const value: ParsedCourseQuery = { page, pageSize, sort };
	if (q !== undefined) {
		return { ok: true, value: { ...value, q, ...(modality !== undefined ? { modality } : {}), ...(status !== undefined ? { status } : {}), ...(tag !== undefined ? { tag } : {}) } };
	}
	return {
		ok: true,
		value: {
			...value,
			...(modality !== undefined ? { modality } : {}),
			...(status !== undefined ? { status } : {}),
			...(tag !== undefined ? { tag } : {}),
		},
	};
}

function toCriteria(parsed: ParsedCourseQuery): CourseSearchCriteria {
	return {
		page: parsed.page,
		pageSize: parsed.pageSize,
		sort: parsed.sort,
		...(parsed.q !== undefined ? { q: parsed.q } : {}),
		...(parsed.modality !== undefined ? { modality: parsed.modality } : {}),
		...(parsed.status !== undefined ? { status: parsed.status } : {}),
		...(parsed.tag !== undefined ? { tag: parsed.tag } : {}),
	};
}

function toPage(parsed: ParsedCourseQuery, result: CourseSearchResult): CoursePage {
	const totalPages = result.totalItems === 0 ? 0 : Math.ceil(result.totalItems / parsed.pageSize);
	return {
		items: result.items.map((course: Course) => ({
			id: course.id,
			title: course.title,
			summary: course.summary,
			modality: course.modality,
			status: course.status,
			tags: [...course.tags],
			createdAt: course.createdAt,
			updatedAt: course.updatedAt,
		})),
		page: parsed.page,
		pageSize: parsed.pageSize,
		totalItems: result.totalItems,
		totalPages,
	};
}

export const queryCourses =
	(dataSources: DataSources) =>
	(raw: RawCourseQuery): Promise<CoursePage> => {
		const parsed = parseCourseQuery(raw);
		if (parsed.ok === false) {
			return Promise.reject(new InvalidCourseQueryError(parsed.details));
		}
		return dataSources.readonlyDataSource.course.search(toCriteria(parsed.value)).then((result: CourseSearchResult) => toPage(parsed.value, result));
	};
