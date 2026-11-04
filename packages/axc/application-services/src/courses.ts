import { COURSE_MODALITIES, COURSE_SORTS, COURSE_STATUSES, type CourseModality, type CoursePage, type CourseSearchQuery, type CourseSort, type CourseStatus, searchCourses } from '@axc/domain';

const DEFAULT_COURSE_PAGE = 1;
const DEFAULT_COURSE_PAGE_SIZE = 10;
const MAX_COURSE_PAGE_SIZE = 50;

const KNOWN_QUERY_FIELDS = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'] as const;
type KnownQueryField = (typeof KNOWN_QUERY_FIELDS)[number];

export interface CourseQueryDetail {
	field: string;
	message: string;
}

export interface InvalidCourseQuery {
	error: {
		code: 'INVALID_QUERY_PARAMETER';
		message: 'One or more query parameters are invalid.';
		details: CourseQueryDetail[];
	};
}

export type CourseSearchResult = { ok: true; page: CoursePage } | { ok: false; error: InvalidCourseQuery };

export type CourseQueryInput = Readonly<Record<string, string | readonly string[] | undefined>>;

export function executeCourseSearch(raw: CourseQueryInput): CourseSearchResult {
	const parsed = parseCourseQuery(raw);
	if (!parsed.ok) {
		return parsed;
	}
	return { ok: true, page: searchCourses(parsed.query) };
}

function parseCourseQuery(raw: CourseQueryInput): { ok: true; query: CourseSearchQuery } | { ok: false; error: InvalidCourseQuery } {
	const details: CourseQueryDetail[] = [];
	for (const field of Object.keys(raw)) {
		if (!isKnownQueryField(field)) {
			details.push({ field, message: `Unknown query parameter "${field}".` });
		}
	}

	const q = readOptional(raw, 'q', details);
	const modality = readModality(raw, details);
	const status = readStatus(raw, details);
	const tag = readTag(raw, details);
	const page = readPage(raw, details);
	const pageSize = readPageSize(raw, details);
	const sort = readSort(raw, details);
	if (details.length > 0 || page === undefined || pageSize === undefined || sort === undefined) {
		return { ok: false, error: invalidQuery(details) };
	}

	const query: CourseSearchQuery = { page, pageSize, sort };
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

function readOptional(raw: CourseQueryInput, field: KnownQueryField, details: CourseQueryDetail[]): string | undefined {
	const value = singleValue(raw, field, details);
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
}

function readTag(raw: CourseQueryInput, details: CourseQueryDetail[]): string | undefined {
	const value = singleValue(raw, 'tag', details);
	if (value === undefined) {
		return undefined;
	}
	if (value === '') {
		details.push({ field: 'tag', message: 'tag must not be empty.' });
		return undefined;
	}
	return value;
}

function readModality(raw: CourseQueryInput, details: CourseQueryDetail[]): CourseModality | undefined {
	const value = singleValue(raw, 'modality', details);
	if (value === undefined) {
		return undefined;
	}
	if (isCourseModality(value)) {
		return value;
	}
	details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
	return undefined;
}

function readStatus(raw: CourseQueryInput, details: CourseQueryDetail[]): CourseStatus | undefined {
	const value = singleValue(raw, 'status', details);
	if (value === undefined) {
		return undefined;
	}
	if (isCourseStatus(value)) {
		return value;
	}
	details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
	return undefined;
}

function readSort(raw: CourseQueryInput, details: CourseQueryDetail[]): CourseSort | undefined {
	const value = singleValue(raw, 'sort', details);
	if (value === undefined) {
		return 'title';
	}
	if (value === '') {
		details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
		return undefined;
	}
	if (isCourseSort(value)) {
		return value;
	}
	details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
	return undefined;
}

function readPage(raw: CourseQueryInput, details: CourseQueryDetail[]): number | undefined {
	const value = singleValue(raw, 'page', details);
	if (value === undefined) {
		return DEFAULT_COURSE_PAGE;
	}
	if (value === '') {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return undefined;
	}
	const parsed = positiveInteger(value);
	if (parsed === undefined) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return undefined;
	}
	return parsed;
}

function readPageSize(raw: CourseQueryInput, details: CourseQueryDetail[]): number | undefined {
	const value = singleValue(raw, 'pageSize', details);
	if (value === undefined) {
		return DEFAULT_COURSE_PAGE_SIZE;
	}
	if (value === '') {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		return undefined;
	}
	const parsed = positiveInteger(value);
	if (parsed === undefined || parsed > MAX_COURSE_PAGE_SIZE) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		return undefined;
	}
	return parsed;
}

function singleValue(raw: CourseQueryInput, field: KnownQueryField, details: CourseQueryDetail[]): string | undefined {
	const rawValue = raw[field];
	if (rawValue === undefined) {
		return undefined;
	}
	const values = typeof rawValue === 'string' ? [rawValue] : rawValue;
	if (values.length === 0) {
		return undefined;
	}
	if (values.length > 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	return values[0]?.trim();
}

function positiveInteger(value: string): number | undefined {
	if (!/^[1-9]\d*$/.test(value)) {
		return undefined;
	}
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function invalidQuery(details: CourseQueryDetail[]): InvalidCourseQuery {
	return {
		error: {
			code: 'INVALID_QUERY_PARAMETER',
			message: 'One or more query parameters are invalid.',
			details,
		},
	};
}

function isKnownQueryField(field: string): field is KnownQueryField {
	return (KNOWN_QUERY_FIELDS as readonly string[]).includes(field);
}

function isCourseModality(value: string): value is CourseModality {
	return (COURSE_MODALITIES as readonly string[]).includes(value);
}

function isCourseStatus(value: string): value is CourseStatus {
	return (COURSE_STATUSES as readonly string[]).includes(value);
}

function isCourseSort(value: string): value is CourseSort {
	return (COURSE_SORTS as readonly string[]).includes(value);
}
