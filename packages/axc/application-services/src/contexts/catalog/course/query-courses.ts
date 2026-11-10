import type { Course, CourseModality, CourseStatus } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

const SUPPORTED_PARAMETERS = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'] as const;
type SupportedParameter = (typeof SUPPORTED_PARAMETERS)[number];

const MODALITIES = ['online', 'in-person', 'hybrid'] as const;
const STATUSES = ['draft', 'active', 'retired'] as const;
const SORTS = ['title', 'createdAt', 'updatedAt'] as const;

type CourseSort = (typeof SORTS)[number];

interface CourseQueryDetail {
	readonly field: string;
	readonly message: string;
}

export class InvalidCourseQueryError extends Error {
	static readonly code = 'INVALID_QUERY_PARAMETER';
	static readonly messageText = 'One or more query parameters are invalid.';

	readonly details: readonly CourseQueryDetail[];

	public constructor(details: readonly CourseQueryDetail[]) {
		super(InvalidCourseQueryError.messageText);
		this.name = 'InvalidCourseQueryError';
		this.details = details;
	}
}

export interface CourseRecord {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CourseSearchPage {
	readonly items: CourseRecord[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

interface ParsedCourseQuery {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSort;
}

function isSupportedParameter(value: string): value is SupportedParameter {
	return (SUPPORTED_PARAMETERS as readonly string[]).includes(value);
}

function isModality(value: string): value is CourseModality {
	return (MODALITIES as readonly string[]).includes(value);
}

function isStatus(value: string): value is CourseStatus {
	return (STATUSES as readonly string[]).includes(value);
}

function isSort(value: string): value is CourseSort {
	return (SORTS as readonly string[]).includes(value);
}

function valuesFor(input: Readonly<Record<string, readonly string[]>>, field: SupportedParameter): readonly string[] | undefined {
	return input[field];
}

function singleValue(field: string, values: readonly string[] | undefined, details: CourseQueryDetail[]): string | undefined {
	if (values === undefined) {
		return undefined;
	}
	if (values.length !== 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	const value = values[0];
	if (value === undefined) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	return value;
}

function parsePositiveInteger(value: string): number | undefined {
	if (!/^[1-9]\d*$/.test(value)) {
		return undefined;
	}
	return Number(value);
}

function parseCourseQuery(input: Readonly<Record<string, readonly string[]>>): ParsedCourseQuery {
	const details: CourseQueryDetail[] = [];
	const keys = Object.keys(input);

	for (const key of keys) {
		if (!isSupportedParameter(key)) {
			details.push({ field: key, message: `${key} is not a supported query parameter.` });
		}
	}

	const qValue = singleValue('q', valuesFor(input, 'q'), details);
	const modalityValue = singleValue('modality', valuesFor(input, 'modality'), details);
	const statusValue = singleValue('status', valuesFor(input, 'status'), details);
	const tagValue = singleValue('tag', valuesFor(input, 'tag'), details);
	const pageValue = singleValue('page', valuesFor(input, 'page'), details);
	const pageSizeValue = singleValue('pageSize', valuesFor(input, 'pageSize'), details);
	const sortValue = singleValue('sort', valuesFor(input, 'sort'), details);

	let q: string | undefined;
	if (qValue !== undefined && qValue.trim() !== '') {
		q = qValue.trim();
	}

	let modality: CourseModality | undefined;
	if (modalityValue !== undefined) {
		if (isModality(modalityValue)) {
			modality = modalityValue;
		} else {
			details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		}
	}

	let status: CourseStatus | undefined;
	if (statusValue !== undefined) {
		if (isStatus(statusValue)) {
			status = statusValue;
		} else {
			details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		}
	}

	let tag: string | undefined;
	if (tagValue !== undefined && tagValue.trim() !== '') {
		tag = tagValue.trim();
	}

	let page = 1;
	if (pageValue !== undefined) {
		const parsed = parsePositiveInteger(pageValue);
		if (parsed === undefined) {
			details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		} else {
			page = parsed;
		}
	}

	let pageSize = 10;
	if (pageSizeValue !== undefined) {
		const parsed = parsePositiveInteger(pageSizeValue);
		if (parsed === undefined || parsed > 50) {
			details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		} else {
			pageSize = parsed;
		}
	}

	let sort: CourseSort = 'title';
	if (sortValue !== undefined) {
		if (isSort(sortValue)) {
			sort = sortValue;
		} else {
			details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		}
	}

	if (details.length > 0) {
		throw new InvalidCourseQueryError(details);
	}

	const parsed: {
		q?: string;
		modality?: CourseModality;
		status?: CourseStatus;
		tag?: string;
		page: number;
		pageSize: number;
		sort: CourseSort;
	} = { page, pageSize, sort };
	if (q !== undefined) {
		parsed.q = q;
	}
	if (modality !== undefined) {
		parsed.modality = modality;
	}
	if (status !== undefined) {
		parsed.status = status;
	}
	if (tag !== undefined) {
		parsed.tag = tag;
	}
	return parsed;
}

function compareText(left: string, right: string): number {
	const normalizedLeft = left.toLowerCase();
	const normalizedRight = right.toLowerCase();
	if (normalizedLeft < normalizedRight) {
		return -1;
	}
	if (normalizedLeft > normalizedRight) {
		return 1;
	}
	return 0;
}

function matchesKeyword(course: Course, keyword: string): boolean {
	const needle = keyword.toLowerCase();
	if (course.props.title.toLowerCase().includes(needle)) {
		return true;
	}
	if (course.props.summary.toLowerCase().includes(needle)) {
		return true;
	}
	return course.props.tags.some((tag) => tag.toLowerCase().includes(needle));
}

function matchesTag(course: Course, tag: string): boolean {
	const needle = tag.toLowerCase();
	return course.props.tags.some((candidate) => candidate.toLowerCase() === needle);
}

function toRecord(course: Course): CourseRecord {
	return {
		id: course.id,
		title: course.props.title,
		summary: course.props.summary,
		modality: course.props.modality,
		status: course.props.status,
		tags: [...course.props.tags],
		createdAt: course.props.createdAt,
		updatedAt: course.props.updatedAt,
	};
}

export const queryCourses = (dataSources: DataSources) => {
	return async (input: Readonly<Record<string, readonly string[]>>): Promise<CourseSearchPage> => {
		const query = parseCourseQuery(input);
		const courses = await dataSources.readonlyDataSource.course.list();
		const matched = courses.filter((course) => {
			if (query.modality !== undefined && course.props.modality !== query.modality) {
				return false;
			}
			if (query.status !== undefined && course.props.status !== query.status) {
				return false;
			}
			if (query.tag !== undefined && !matchesTag(course, query.tag)) {
				return false;
			}
			if (query.q !== undefined && !matchesKeyword(course, query.q)) {
				return false;
			}
			return true;
		});

		const sorted = [...matched].sort((left, right) => {
			const primary = compareText(left.props[query.sort], right.props[query.sort]);
			if (primary !== 0) {
				return primary;
			}
			return compareText(left.props.id, right.props.id);
		});

		const totalItems = sorted.length;
		const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);
		const start = (query.page - 1) * query.pageSize;
		const items = sorted.slice(start, start + query.pageSize).map((course) => toRecord(course));

		return {
			items,
			page: query.page,
			pageSize: query.pageSize,
			totalItems,
			totalPages,
		};
	};
};
