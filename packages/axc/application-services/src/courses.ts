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
const int = (v: string, min: number, max: number): number | undefined => (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : undefined);

export const courseService = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page: rawPage = '1', pageSize: rawSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		const page = int(rawPage, 1, Number.MAX_SAFE_INTEGER);
		if (page === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		const pageSize = int(rawSize, 1, 50);
		if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		const sortKey = SORTS.find((s) => s === sort);
		if (sortKey === undefined) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (page === undefined || pageSize === undefined || sortKey === undefined || details.length > 0) {
			throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		}
		const needle = q?.toLowerCase();
		const t = tag?.toLowerCase();
		const items = (await repo.getAll())
			.map((c) => c.toReference())
			.filter(
				(c) =>
					(!needle || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))) &&
					(!modality || c.modality === modality) &&
					(!status || c.status === status) &&
					(!t || c.tags.some((x) => x.toLowerCase() === t)),
			)
			.sort((a, b) => a[sortKey].localeCompare(b[sortKey]));
		return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) };
	},
});
