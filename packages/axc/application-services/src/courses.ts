export type CourseModality = 'online' | 'in-person' | 'hybrid';

export type CourseStatus = 'draft' | 'active' | 'retired';

export type CourseSortField = 'title' | 'createdAt' | 'updatedAt';

export interface Course {
	id: string;
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export type CourseSearchQueryInput = Record<string, string | undefined>;

export interface CourseSearchPage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface CourseQueryErrorDetail {
	field: string;
	message: string;
}

export interface CourseSearchError {
	code: 'INVALID_QUERY_PARAMETER';
	message: 'One or more query parameters are invalid.';
	details: CourseQueryErrorDetail[];
}

export type CourseSearchResult = { ok: true; value: CourseSearchPage } | { ok: false; error: CourseSearchError };

const MODALITIES: readonly CourseModality[] = ['online', 'in-person', 'hybrid'];
const STATUSES: readonly CourseStatus[] = ['draft', 'active', 'retired'];
const SORT_FIELDS: readonly CourseSortField[] = ['title', 'createdAt', 'updatedAt'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const DIGITS_ONLY = /^\d+$/;

interface CourseSearchCriteria {
	q: string;
	tag: string;
	modality: CourseModality | undefined;
	status: CourseStatus | undefined;
	page: number;
	pageSize: number;
	sort: CourseSortField;
}

type FieldResult<T> = { ok: true; value: T } | { ok: false; message: string };

function oneOf<T extends string>(field: string, allowed: readonly T[], raw: string | undefined): FieldResult<T | undefined> {
	if (raw === undefined) return { ok: true, value: undefined };
	const match = allowed.find((value) => value === raw);
	return match === undefined ? { ok: false, message: `${field} must be one of: ${allowed.join(', ')}.` } : { ok: true, value: match };
}

function integerInRange(raw: string | undefined, fallback: number, min: number, max: number, message: string): FieldResult<number> {
	if (raw === undefined) return { ok: true, value: fallback };
	const value = DIGITS_ONLY.test(raw) ? Number(raw) : Number.NaN;
	return Number.isSafeInteger(value) && value >= min && value <= max ? { ok: true, value } : { ok: false, message };
}

function parseCriteria(query: CourseSearchQueryInput): { ok: true; value: CourseSearchCriteria } | { ok: false; details: CourseQueryErrorDetail[] } {
	const { q: rawQ, tag: rawTag, modality: rawModality, status: rawStatus, page: rawPage, pageSize: rawPageSize, sort: rawSort } = query;
	const modality = oneOf('modality', MODALITIES, rawModality);
	const status = oneOf('status', STATUSES, rawStatus);
	const page = integerInRange(rawPage, DEFAULT_PAGE, 1, Number.MAX_SAFE_INTEGER, 'page must be a positive integer.');
	const pageSize = integerInRange(rawPageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE, `pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
	const sort = oneOf('sort', SORT_FIELDS, rawSort);
	const fields: [string, FieldResult<unknown>][] = [
		['modality', modality],
		['status', status],
		['page', page],
		['pageSize', pageSize],
		['sort', sort],
	];
	const details = fields.flatMap(([field, result]) => (result.ok ? [] : [{ field, message: result.message }]));
	if (!(modality.ok && status.ok && page.ok && pageSize.ok && sort.ok)) return { ok: false, details };
	const q = (rawQ ?? '').trim().toLowerCase();
	const tag = (rawTag ?? '').trim().toLowerCase();
	return { ok: true, value: { q, tag, modality: modality.value, status: status.value, page: page.value, pageSize: pageSize.value, sort: sort.value ?? 'title' } };
}

function matches(course: Course, criteria: CourseSearchCriteria): boolean {
	const tags = course.tags.map((tag) => tag.toLowerCase());
	if (criteria.modality !== undefined && course.modality !== criteria.modality) return false;
	if (criteria.status !== undefined && course.status !== criteria.status) return false;
	if (criteria.tag !== '' && !tags.includes(criteria.tag)) return false;
	if (criteria.q === '') return true;
	return [course.title.toLowerCase(), course.summary.toLowerCase(), ...tags].some((text) => text.includes(criteria.q));
}

function compareStrings(a: string, b: string): number {
	if (a < b) return -1;
	return a > b ? 1 : 0;
}

function compareCourses(sort: CourseSortField): (a: Course, b: Course) => number {
	const primary = sort === 'title' ? (a: Course, b: Course) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) : (a: Course, b: Course) => compareStrings(a[sort], b[sort]);
	return (a, b) => primary(a, b) || compareStrings(a.id, b.id);
}

function copyCourse(course: Course): Course {
	return { ...course, tags: [...course.tags] };
}

export function searchCourses(query: CourseSearchQueryInput, courses: readonly Course[]): CourseSearchResult {
	const parsed = parseCriteria(query);
	if (!parsed.ok) return { ok: false, error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: parsed.details } };
	const { page, pageSize, sort } = parsed.value;
	const matched = courses.filter((course) => matches(course, parsed.value)).sort(compareCourses(sort));
	const start = (page - 1) * pageSize;
	const items = matched.slice(start, start + pageSize).map(copyCourse);
	return { ok: true, value: { items, page, pageSize, totalItems: matched.length, totalPages: Math.ceil(matched.length / pageSize) } };
}
