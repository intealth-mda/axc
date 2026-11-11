import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseStatus } from '@axc/domain';
import { type ErrorDetail, ServiceError } from './service-error.ts';

export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: string | undefined;
	pageSize?: string | undefined;
	sort?: string | undefined;
}

export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
type SortField = (typeof SORTS)[number];

const intIn = (raw: string, min: number, max: number): number | undefined => {
	const n = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
	return n >= min && n <= max ? n : undefined;
};

export const createCourseService = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page: rawPage = '1', pageSize: rawPageSize = '10', sort = 'title' } = query;
		const errors: ErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) errors.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) errors.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		const page = intIn(rawPage, 1, Number.MAX_SAFE_INTEGER);
		if (page === undefined) errors.push({ field: 'page', message: 'page must be a positive integer.' });
		const pageSize = intIn(rawPageSize, 1, 50);
		if (pageSize === undefined) errors.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!(SORTS as readonly string[]).includes(sort)) errors.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (errors.length > 0 || page === undefined || pageSize === undefined) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', errors);

		const needle = q?.toLowerCase();
		const wantTag = tag?.toLowerCase();
		const key = sort as SortField;
		const matches = (await repo.getAll())
			.map((c) => c.toReference())
			.filter(
				(c) =>
					(modality === undefined || c.modality === modality) &&
					(status === undefined || c.status === status) &&
					(wantTag === undefined || c.tags.some((t) => t.toLowerCase() === wantTag)) &&
					(needle === undefined || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))),
			)
			.sort((a, b) => a[key].localeCompare(b[key]));
		return { items: matches.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems: matches.length, totalPages: Math.ceil(matches.length / pageSize) };
	},
});
