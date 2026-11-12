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

export interface CourseSearchResult {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const SORTS = ['title', 'createdAt', 'updatedAt'] as const;
type Sort = (typeof SORTS)[number];
const isSort = (v: string): v is Sort => (SORTS as readonly string[]).includes(v);

const int = (v: string, min: number, max: number): number | undefined => {
	if (!/^\d+$/.test(v)) return undefined;
	const n = Number(v);
	return n >= min && n <= max ? n : undefined;
};

export function courseService(repo: CourseRepository) {
	return {
		async search(query: CourseSearchQuery): Promise<CourseSearchResult> {
			const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
			const errors: ErrorDetail[] = [];
			if (modality !== undefined && !isCourseModality(modality)) errors.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
			if (status !== undefined && !isCourseStatus(status)) errors.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
			const pageN = int(page, 1, Number.MAX_SAFE_INTEGER);
			if (pageN === undefined) errors.push({ field: 'page', message: 'page must be a positive integer.' });
			const sizeN = int(pageSize, 1, 50);
			if (sizeN === undefined) errors.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
			if (!isSort(sort)) errors.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
			if (errors.length > 0 || pageN === undefined || sizeN === undefined || !isSort(sort)) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', errors);

			const kw = q?.toLowerCase();
			const tg = tag?.toLowerCase();
			const matches = (await repo.getAll())
				.map((c) => c.toReference())
				.filter(
					(c) =>
						(modality === undefined || c.modality === modality) &&
						(status === undefined || c.status === status) &&
						(tg === undefined || c.tags.some((t) => t.toLowerCase() === tg)) &&
						(kw === undefined || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(kw))),
				)
				.sort((a, b) => a[sort].localeCompare(b[sort]));
			return {
				items: matches.slice((pageN - 1) * sizeN, pageN * sizeN),
				page: pageN,
				pageSize: sizeN,
				totalItems: matches.length,
				totalPages: Math.ceil(matches.length / sizeN),
			};
		},
	};
}
