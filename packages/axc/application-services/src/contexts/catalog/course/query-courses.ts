import {
	COURSE_MODALITIES,
	COURSE_PAGE_DEFAULT,
	COURSE_PAGE_SIZE_DEFAULT,
	COURSE_PAGE_SIZE_MAX,
	COURSE_SORT_FIELDS,
	COURSE_STATUSES,
	type Course,
	type CourseModality,
	type CourseSearchCriteria,
	type CourseSortField,
	type CourseStatus,
	isCourseModality,
	isCourseSortField,
	isCourseStatus,
} from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export const INVALID_COURSE_QUERY_CODE = 'INVALID_QUERY_PARAMETER';
export const INVALID_COURSE_QUERY_MESSAGE = 'One or more query parameters are invalid.';

export interface CourseQueryFieldError {
	readonly field: string;
	readonly message: string;
}

export class InvalidCourseQueryError extends Error {
	public readonly details: readonly CourseQueryFieldError[];

	public constructor(details: readonly CourseQueryFieldError[]) {
		super(INVALID_COURSE_QUERY_MESSAGE);
		this.name = 'InvalidCourseQueryError';
		this.details = details;
	}
}

export interface CourseSearchRawQuery {
	readonly q?: string;
	readonly modality?: string;
	readonly status?: string;
	readonly tag?: string;
	readonly page?: string;
	readonly pageSize?: string;
	readonly sort?: string;
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

export interface CourseSearchResult {
	readonly items: readonly CourseRecord[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export const searchCourses =
	(dataSources: DataSources) =>
	async (raw: CourseSearchRawQuery): Promise<CourseSearchResult> => {
		const criteria = parseCourseSearchQuery(raw);
		const page = await dataSources.readonlyDataSource.course.search(criteria);
		return {
			items: page.items.map(toRecord),
			page: page.page,
			pageSize: page.pageSize,
			totalItems: page.totalItems,
			totalPages: page.totalPages,
		};
	};

function parseCourseSearchQuery(raw: CourseSearchRawQuery): CourseSearchCriteria {
	const details: CourseQueryFieldError[] = [];
	const q = optionalText(raw.q);
	const tag = optionalText(raw.tag);
	const modality = parseModality(raw.modality, details);
	const status = parseStatus(raw.status, details);
	const page = parsePage(raw.page, details);
	const pageSize = parsePageSize(raw.pageSize, details);
	const sort = parseSort(raw.sort, details);

	if (details.length > 0) {
		throw new InvalidCourseQueryError(details);
	}

	return {
		page,
		pageSize,
		sort,
		...(q === undefined ? {} : { q }),
		...(modality === undefined ? {} : { modality }),
		...(status === undefined ? {} : { status }),
		...(tag === undefined ? {} : { tag }),
	};
}

function optionalText(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	return trimmed;
}

function parseModality(value: string | undefined, details: CourseQueryFieldError[]): CourseModality | undefined {
	if (value === undefined) {
		return undefined;
	}
	const trimmed = value.trim();
	if (!isCourseModality(trimmed)) {
		details.push({ field: 'modality', message: `modality must be one of ${COURSE_MODALITIES.join(', ')}.` });
		return undefined;
	}
	return trimmed;
}

function parseStatus(value: string | undefined, details: CourseQueryFieldError[]): CourseStatus | undefined {
	if (value === undefined) {
		return undefined;
	}
	const trimmed = value.trim();
	if (!isCourseStatus(trimmed)) {
		details.push({ field: 'status', message: `status must be one of ${COURSE_STATUSES.join(', ')}.` });
		return undefined;
	}
	return trimmed;
}

function parseSort(value: string | undefined, details: CourseQueryFieldError[]): CourseSortField {
	if (value === undefined) {
		return 'title';
	}
	const trimmed = value.trim();
	if (!isCourseSortField(trimmed)) {
		details.push({ field: 'sort', message: `sort must be one of ${COURSE_SORT_FIELDS.join(', ')}.` });
		return 'title';
	}
	return trimmed;
}

function parsePage(value: string | undefined, details: CourseQueryFieldError[]): number {
	if (value === undefined) {
		return COURSE_PAGE_DEFAULT;
	}
	const parsed = parseWholeNumber(value);
	if (parsed === undefined || parsed < 1) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return COURSE_PAGE_DEFAULT;
	}
	return parsed;
}

function parsePageSize(value: string | undefined, details: CourseQueryFieldError[]): number {
	if (value === undefined) {
		return COURSE_PAGE_SIZE_DEFAULT;
	}
	const parsed = parseWholeNumber(value);
	if (parsed === undefined || parsed < 1 || parsed > COURSE_PAGE_SIZE_MAX) {
		details.push({ field: 'pageSize', message: `pageSize must be between 1 and ${COURSE_PAGE_SIZE_MAX}.` });
		return COURSE_PAGE_SIZE_DEFAULT;
	}
	return parsed;
}

function parseWholeNumber(value: string): number | undefined {
	const trimmed = value.trim();
	if (!/^[0-9]+$/.test(trimmed)) {
		return undefined;
	}
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed)) {
		return undefined;
	}
	return parsed;
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
