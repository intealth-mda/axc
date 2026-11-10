import {
	COURSE_MODALITIES,
	COURSE_SORTS,
	COURSE_STATUSES,
	type Course,
	type CourseModality,
	type CourseSearchCriteria,
	type CourseSort,
	type CourseStatus,
	DEFAULT_COURSE_PAGE,
	DEFAULT_COURSE_PAGE_SIZE,
	MAX_COURSE_PAGE_SIZE,
} from '@axc/domain';
import type { DataSources } from '@axc/persistence';

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

export interface CourseCatalogPage {
	readonly items: readonly CourseRecord[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export interface RawCourseQuery {
	readonly q?: string;
	readonly modality?: string;
	readonly status?: string;
	readonly tag?: string;
	readonly page?: string;
	readonly pageSize?: string;
	readonly sort?: string;
}

interface CourseQueryDetail {
	readonly field: string;
	readonly message: string;
}

export interface CourseQueryErrorBody {
	readonly error: {
		readonly code: 'INVALID_QUERY_PARAMETER';
		readonly message: 'One or more query parameters are invalid.';
		readonly details: readonly CourseQueryDetail[];
	};
}

export type ParseCourseQueryResult = { readonly ok: true; readonly query: CourseSearchCriteria } | { readonly ok: false; readonly error: CourseQueryErrorBody };

const MODALITY_MESSAGE = 'modality must be one of online, in-person, hybrid.';
const STATUS_MESSAGE = 'status must be one of draft, active, retired.';
const PAGE_MESSAGE = 'page must be an integer greater than or equal to 1.';
const PAGE_SIZE_MESSAGE = 'pageSize must be between 1 and 50.';
const SORT_MESSAGE = 'sort must be one of title, createdAt, updatedAt.';
const POSITIVE_INTEGER = /^[1-9]\d*$/;

function supplied(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	return value.trim();
}

function parseEnum<T extends string>(value: string | undefined, field: string, allowed: readonly T[], message: string, details: CourseQueryDetail[]): T | undefined {
	if (value === undefined) {
		return undefined;
	}
	const match = allowed.find((item) => item === value);
	if (value.length === 0 || match === undefined) {
		details.push({ field, message });
		return undefined;
	}
	return match;
}

function parseInteger(value: string | undefined, field: string, minimum: number, maximum: number | undefined, message: string, details: CourseQueryDetail[]): number | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (!POSITIVE_INTEGER.test(value)) {
		details.push({ field, message });
		return undefined;
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed < minimum || (maximum !== undefined && parsed > maximum)) {
		details.push({ field, message });
		return undefined;
	}
	return parsed;
}

function buildQuery(q: string | undefined, modality: CourseModality | undefined, status: CourseStatus | undefined, tag: string | undefined, page: number, pageSize: number, sort: CourseSort): CourseSearchCriteria {
	const query: {
		q?: string;
		modality?: CourseModality;
		status?: CourseStatus;
		tag?: string;
		page: number;
		pageSize: number;
		sort: CourseSort;
	} = { page, pageSize, sort };
	if (q !== undefined && q.length > 0) {
		query.q = q;
	}
	if (modality !== undefined) {
		query.modality = modality;
	}
	if (status !== undefined) {
		query.status = status;
	}
	if (tag !== undefined && tag.length > 0) {
		query.tag = tag;
	}
	return query;
}

export function parseCourseQuery(raw: RawCourseQuery): ParseCourseQueryResult {
	const details: CourseQueryDetail[] = [];
	const q = supplied(raw.q);
	const tag = supplied(raw.tag);
	const modality = parseEnum(supplied(raw.modality), 'modality', COURSE_MODALITIES, MODALITY_MESSAGE, details);
	const status = parseEnum(supplied(raw.status), 'status', COURSE_STATUSES, STATUS_MESSAGE, details);
	const page = parseInteger(supplied(raw.page), 'page', 1, undefined, PAGE_MESSAGE, details);
	const pageSize = parseInteger(supplied(raw.pageSize), 'pageSize', 1, MAX_COURSE_PAGE_SIZE, PAGE_SIZE_MESSAGE, details);
	const sort = parseEnum(supplied(raw.sort), 'sort', COURSE_SORTS, SORT_MESSAGE, details);

	if (details.length > 0) {
		return {
			ok: false,
			error: {
				error: {
					code: 'INVALID_QUERY_PARAMETER',
					message: 'One or more query parameters are invalid.',
					details,
				},
			},
		};
	}

	return {
		ok: true,
		query: buildQuery(q, modality, status, tag, page ?? DEFAULT_COURSE_PAGE, pageSize ?? DEFAULT_COURSE_PAGE_SIZE, sort ?? 'title'),
	};
}

function toCourseRecord(course: Course): CourseRecord {
	return {
		id: course.id,
		title: course.title,
		summary: course.summary,
		modality: course.modality,
		status: course.status,
		tags: [...course.tags],
		createdAt: course.createdAt,
		updatedAt: course.updatedAt,
	};
}

export function findCourses(dataSources: DataSources): (query: CourseSearchCriteria) => Promise<CourseCatalogPage> {
	return async (query: CourseSearchCriteria): Promise<CourseCatalogPage> => {
		const page = await dataSources.readonlyDataSource.course.search(query);
		return {
			items: page.items.map(toCourseRecord),
			page: page.page,
			pageSize: page.pageSize,
			totalItems: page.totalItems,
			totalPages: page.totalPages,
		};
	};
}
