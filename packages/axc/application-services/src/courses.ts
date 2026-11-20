import { type CourseEntityReference, type CourseRepository, isCourseStatus, isModality } from '@axc/domain';
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
const Sorts = ['title', 'createdAt', 'updatedAt'] as const;
const isSort = (v: string): v is (typeof Sorts)[number] => (Sorts as readonly string[]).includes(v);
const int = (v: string, min: number, max: number) => (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : undefined);

export const courseService = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		const p = int(page, 1, Number.MAX_SAFE_INTEGER);
		const size = int(pageSize, 1, 50);
		if (modality !== undefined && !isModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (p === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		if (size === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (details.length || p === undefined || size === undefined || !isSort(sort)) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		const items = (await repo.getAll())
			.filter((c) => (!q || c.matchesKeyword(q)) && (!modality || c.props.modality === modality) && (!status || c.props.status === status) && (!tag || c.hasTag(tag)))
			.map((c) => c.toReference())
			.sort((a, b) => a[sort].localeCompare(b[sort]));
		return { items: items.slice((p - 1) * size, p * size), page: p, pageSize: size, totalItems: items.length, totalPages: Math.ceil(items.length / size) };
	},
});
