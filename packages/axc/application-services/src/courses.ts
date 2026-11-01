export type CourseModality = 'online' | 'in-person' | 'hybrid';
export type CourseStatus = 'draft' | 'active' | 'retired';
export type CourseSort = 'title' | 'createdAt' | 'updatedAt';

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

export interface CourseSearchQuery {
	q?: string;
	modality?: CourseModality;
	status?: CourseStatus;
	tag?: string;
	page: number;
	pageSize: number;
	sort: CourseSort;
}

export interface CourseSearchResult {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface QueryParameterError {
	field: string;
	message: string;
}

export type ParseCourseQueryResult = { ok: true; query: CourseSearchQuery } | { ok: false; errors: QueryParameterError[] };

const MODALITIES: readonly CourseModality[] = ['online', 'in-person', 'hybrid'];
const STATUSES: readonly CourseStatus[] = ['draft', 'active', 'retired'];
const SORTS: readonly CourseSort[] = ['title', 'createdAt', 'updatedAt'];
const MAX_PAGE_SIZE = 50;

function parseInteger(value: string | undefined, fallback: number, min: number, max: number): number | undefined {
	if (value === undefined) {
		return fallback;
	}
	if (!/^\d+$/.test(value)) {
		return undefined;
	}
	const parsed = Number(value);
	return parsed >= min && parsed <= max ? parsed : undefined;
}

function nonBlank(value: string | undefined): string | undefined {
	return value === undefined || value.trim() === '' ? undefined : value;
}

export function parseCourseQuery(raw: Record<string, string | undefined>): ParseCourseQueryResult {
	const { page: rawPage, pageSize: rawPageSize, q: rawQ, tag: rawTag } = raw;
	const errors: QueryParameterError[] = [];
	const pick = <T extends string>(field: string, allowed: readonly T[]): T | undefined => {
		const value = raw[field];
		if (value === undefined || (allowed as readonly string[]).includes(value)) {
			return value as T | undefined;
		}
		errors.push({ field, message: `${field} must be one of: ${allowed.join(', ')}.` });
		return undefined;
	};

	const page = parseInteger(rawPage, 1, 1, Number.MAX_SAFE_INTEGER);
	if (page === undefined) {
		errors.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
	}
	const pageSize = parseInteger(rawPageSize, 10, 1, MAX_PAGE_SIZE);
	if (pageSize === undefined) {
		errors.push({ field: 'pageSize', message: `pageSize must be between 1 and ${MAX_PAGE_SIZE}.` });
	}
	const modality = pick('modality', MODALITIES);
	const status = pick('status', STATUSES);
	const sort = pick('sort', SORTS) ?? 'title';

	if (errors.length > 0 || page === undefined || pageSize === undefined) {
		return { ok: false, errors };
	}

	const query: CourseSearchQuery = { page, pageSize, sort };
	const q = nonBlank(rawQ);
	const tag = nonBlank(rawTag);
	if (q !== undefined) query.q = q;
	if (modality !== undefined) query.modality = modality;
	if (status !== undefined) query.status = status;
	if (tag !== undefined) query.tag = tag;
	return { ok: true, query };
}

export function searchCourses(courses: readonly Course[], query: CourseSearchQuery): CourseSearchResult {
	const q = query.q?.trim().toLowerCase();
	const tag = query.tag?.trim().toLowerCase();
	const matches = courses.filter(
		(course) =>
			(query.modality === undefined || course.modality === query.modality) &&
			(query.status === undefined || course.status === query.status) &&
			(tag === undefined || course.tags.some((t) => t.toLowerCase() === tag)) &&
			(q === undefined || [course.title, course.summary, ...course.tags].some((text) => text.toLowerCase().includes(q))),
	);
	const compare = (a: Course, b: Course) => (query.sort === 'title' ? a.title.localeCompare(b.title) : a[query.sort] < b[query.sort] ? -1 : a[query.sort] > b[query.sort] ? 1 : 0);
	matches.sort((a, b) => compare(a, b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

	const start = (query.page - 1) * query.pageSize;
	return {
		items: matches.slice(start, start + query.pageSize),
		page: query.page,
		pageSize: query.pageSize,
		totalItems: matches.length,
		totalPages: Math.ceil(matches.length / query.pageSize),
	};
}
