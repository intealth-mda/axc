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

/** Raw query-string values, validated by searchCourses. */
export type CourseSearchParams = Partial<Record<'q' | 'modality' | 'status' | 'tag' | 'page' | 'pageSize' | 'sort', string>>;

export interface CoursePage {
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

export type CourseSearchResult = { ok: true; value: CoursePage } | { ok: false; errors: QueryParameterError[] };

const MODALITIES: readonly string[] = ['online', 'in-person', 'hybrid'];
const STATUSES: readonly string[] = ['draft', 'active', 'retired'];
const SORTS: readonly string[] = ['title', 'createdAt', 'updatedAt'];

/** Absent uses the fallback; anything but a plain digit string is NaN (invalid). */
function parseCount(value: string | undefined, fallback: number): number {
	if (value === undefined) {
		return fallback;
	}
	return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}

export function searchCourses(courses: readonly Course[], params: CourseSearchParams): CourseSearchResult {
	const { modality, status, tag, sort = 'title' } = params;
	const page = parseCount(params.page, 1);
	const pageSize = parseCount(params.pageSize, 10);
	const errors: QueryParameterError[] = [];

	if (modality !== undefined && !MODALITIES.includes(modality)) {
		errors.push({ field: 'modality', message: 'modality must be one of: online, in-person, hybrid.' });
	}
	if (status !== undefined && !STATUSES.includes(status)) {
		errors.push({ field: 'status', message: 'status must be one of: draft, active, retired.' });
	}
	if (tag === '') {
		errors.push({ field: 'tag', message: 'tag must not be empty.' });
	}
	if (!(page >= 1)) {
		errors.push({ field: 'page', message: 'page must be a positive integer.' });
	}
	if (!(pageSize >= 1 && pageSize <= 50)) {
		errors.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
	}
	if (!SORTS.includes(sort)) {
		errors.push({ field: 'sort', message: 'sort must be one of: title, createdAt, updatedAt.' });
	}
	if (errors.length > 0) {
		return { ok: false, errors };
	}

	const q = params.q?.trim().toLowerCase() ?? '';
	const wantedTag = tag?.toLowerCase();
	const sortKey = sort as CourseSort;
	const matches = courses
		.filter(
			(course) =>
				(modality === undefined || course.modality === modality) &&
				(status === undefined || course.status === status) &&
				(wantedTag === undefined || course.tags.some((t) => t.toLowerCase() === wantedTag)) &&
				(q === '' || [course.title, course.summary, ...course.tags].some((text) => text.toLowerCase().includes(q))),
		)
		// Ascending; ISO timestamps share one format so localeCompare orders them too. Ties by id.
		.sort((a, b) => a[sortKey].localeCompare(b[sortKey]) || a.id.localeCompare(b.id));

	return {
		ok: true,
		value: {
			items: matches.slice((page - 1) * pageSize, page * pageSize),
			page,
			pageSize,
			totalItems: matches.length,
			totalPages: Math.ceil(matches.length / pageSize),
		},
	};
}
