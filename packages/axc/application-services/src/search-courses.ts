import { COURSE_MODALITIES, COURSE_STATUSES, type Course, type CourseCatalog, type CourseModality, type CourseStatus } from '@axc/domain';

const DEFAULT_COURSE_PAGE = 1;
const DEFAULT_COURSE_PAGE_SIZE = 10;
const MAX_COURSE_PAGE_SIZE = 50;
const COURSE_SORT_FIELDS = ['title', 'createdAt', 'updatedAt'] as const;
const INVALID_COURSE_QUERY = 'INVALID_QUERY_PARAMETER' as const;
const INVALID_COURSE_QUERY_MESSAGE = 'One or more query parameters are invalid.' as const;

const KNOWN_QUERY_FIELDS = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'] as const;

type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

export type RawCourseQuery = Readonly<Record<string, readonly string[] | undefined>>;

export interface CourseListItem {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CourseSearchPage {
	readonly items: readonly CourseListItem[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export interface CourseQueryFieldError {
	readonly field: string;
	readonly message: string;
}

export interface CourseQueryErrorBody {
	readonly error: {
		readonly code: typeof INVALID_COURSE_QUERY;
		readonly message: typeof INVALID_COURSE_QUERY_MESSAGE;
		readonly details: readonly CourseQueryFieldError[];
	};
}

export type CourseSearchOutcome = { readonly ok: true; readonly body: CourseSearchPage } | { readonly ok: false; readonly body: CourseQueryErrorBody };

interface CourseSearchQuery {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSortField;
}

export function searchCourses(catalog: CourseCatalog, rawQuery: RawCourseQuery): Promise<CourseSearchOutcome> {
	const parsed = parseCourseQuery(rawQuery);
	if (!parsed.ok) {
		return Promise.resolve(parsed);
	}
	return catalog.listCourses().then((courses) => ({ ok: true as const, body: pageCourses(courses, parsed.query) }));
}

function parseCourseQuery(rawQuery: RawCourseQuery): { ok: true; query: CourseSearchQuery } | { ok: false; body: CourseQueryErrorBody } {
	const details: CourseQueryFieldError[] = [];
	const q = readOptionalText(rawQuery, 'q', details);
	const modality = readMember(rawQuery, 'modality', COURSE_MODALITIES, `modality must be one of ${COURSE_MODALITIES.join(', ')}.`, details);
	const status = readMember(rawQuery, 'status', COURSE_STATUSES, `status must be one of ${COURSE_STATUSES.join(', ')}.`, details);
	const tag = readRequiredText(rawQuery, 'tag', 'tag must be a non-empty string.', details);
	const page = readInteger(rawQuery, 'page', DEFAULT_COURSE_PAGE, (value) => value >= 1, 'page must be an integer greater than or equal to 1.', details);
	const pageSize = readInteger(rawQuery, 'pageSize', DEFAULT_COURSE_PAGE_SIZE, (value) => value >= 1 && value <= MAX_COURSE_PAGE_SIZE, `pageSize must be between 1 and ${MAX_COURSE_PAGE_SIZE}.`, details);
	const sort = readMember(rawQuery, 'sort', COURSE_SORT_FIELDS, `sort must be one of ${COURSE_SORT_FIELDS.join(', ')}.`, details) ?? 'title';

	for (const field of Object.keys(rawQuery).sort()) {
		if (!isKnownQueryField(field)) {
			details.push({ field, message: `${field} is not a supported query parameter.` });
		}
	}

	if (details.length > 0) {
		return {
			ok: false,
			body: {
				error: {
					code: INVALID_COURSE_QUERY,
					message: INVALID_COURSE_QUERY_MESSAGE,
					details,
				},
			},
		};
	}

	const query: {
		q?: string;
		modality?: CourseModality;
		status?: CourseStatus;
		tag?: string;
		page: number;
		pageSize: number;
		sort: CourseSortField;
	} = { page, pageSize, sort };
	if (q !== undefined) {
		query.q = q;
	}
	if (modality !== undefined) {
		query.modality = modality;
	}
	if (status !== undefined) {
		query.status = status;
	}
	if (tag !== undefined) {
		query.tag = tag;
	}
	return { ok: true, query };
}

function readOptionalText(rawQuery: RawCourseQuery, field: string, details: CourseQueryFieldError[]): string | undefined {
	const value = readSingle(rawQuery, field, details);
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
}

function readRequiredText(rawQuery: RawCourseQuery, field: string, message: string, details: CourseQueryFieldError[]): string | undefined {
	const value = readSingle(rawQuery, field, details);
	if (value === undefined) {
		return undefined;
	}
	if (value === '') {
		details.push({ field, message });
		return undefined;
	}
	return value;
}

function readMember<T extends string>(rawQuery: RawCourseQuery, field: string, allowed: readonly T[], message: string, details: CourseQueryFieldError[]): T | undefined {
	const value = readSingle(rawQuery, field, details);
	if (value === undefined || value === '') {
		if (value === '') {
			details.push({ field, message });
		}
		return undefined;
	}
	if (!isMember(allowed, value)) {
		details.push({ field, message });
		return undefined;
	}
	return value;
}

function readInteger(rawQuery: RawCourseQuery, field: string, fallback: number, valid: (value: number) => boolean, message: string, details: CourseQueryFieldError[]): number {
	const value = readSingle(rawQuery, field, details);
	if (value === undefined || value === '') {
		if (value === '') {
			details.push({ field, message });
		}
		return fallback;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field, message });
		return fallback;
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || !valid(parsed)) {
		details.push({ field, message });
		return fallback;
	}
	return parsed;
}

function readSingle(rawQuery: RawCourseQuery, field: string, details: CourseQueryFieldError[]): string | undefined {
	const values = rawQuery[field];
	if (values === undefined || values.length === 0) {
		return undefined;
	}
	if (values.length > 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	const value = values[0];
	if (value === undefined) {
		return undefined;
	}
	return value.trim();
}

function pageCourses(courses: readonly Course[], query: CourseSearchQuery): CourseSearchPage {
	const filtered = courses.filter((course) => matchesCourse(course, query));
	const sorted = [...filtered].sort((left, right) => compareCourses(query.sort, left, right));
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);
	const start = (query.page - 1) * query.pageSize;
	const items = sorted.slice(start, start + query.pageSize).map(toListItem);
	return {
		items,
		page: query.page,
		pageSize: query.pageSize,
		totalItems,
		totalPages,
	};
}

function matchesCourse(course: Course, query: CourseSearchQuery): boolean {
	if (query.modality !== undefined && course.modality !== query.modality) {
		return false;
	}
	if (query.status !== undefined && course.status !== query.status) {
		return false;
	}
	if (query.tag !== undefined && !course.tags.some((tag) => tag.toLowerCase() === query.tag?.toLowerCase())) {
		return false;
	}
	if (query.q !== undefined && !matchesKeyword(course, query.q)) {
		return false;
	}
	return true;
}

function matchesKeyword(course: Course, keyword: string): boolean {
	const needle = keyword.toLowerCase();
	if (course.title.toLowerCase().includes(needle) || course.summary.toLowerCase().includes(needle)) {
		return true;
	}
	return course.tags.some((tag) => tag.toLowerCase().includes(needle));
}

function compareCourses(sort: CourseSortField, left: Course, right: Course): number {
	const primary = compareField(sort, left, right);
	if (primary !== 0) {
		return primary;
	}
	return left.id.localeCompare(right.id);
}

function compareField(sort: CourseSortField, left: Course, right: Course): number {
	if (sort === 'title') {
		return left.title.localeCompare(right.title, 'en', { numeric: true, sensitivity: 'base' });
	}
	if (sort === 'createdAt') {
		return left.createdAt.localeCompare(right.createdAt);
	}
	return left.updatedAt.localeCompare(right.updatedAt);
}

function toListItem(course: Course): CourseListItem {
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

function isKnownQueryField(field: string): field is (typeof KNOWN_QUERY_FIELDS)[number] {
	return KNOWN_QUERY_FIELDS.some((candidate) => candidate === field);
}

function isMember<T extends string>(values: readonly T[], value: string): value is T {
	return values.some((candidate) => candidate === value);
}
