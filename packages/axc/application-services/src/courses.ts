import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseSort, isCourseStatus } from '@axc/domain';
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

const int = (v: string, min: number, max: number) => (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : undefined);

export const courseService = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be online, in-person or hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be draft, active or retired.' });
		if (!isCourseSort(sort)) details.push({ field: 'sort', message: 'sort must be title, createdAt or updatedAt.' });
		const p = int(page, 1, Number.MAX_SAFE_INTEGER);
		if (p === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		const size = int(pageSize, 1, 50);
		if (size === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (details.length || p === undefined || size === undefined || !isCourseSort(sort)) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		const matched = (await repo.getAll())
			.filter((c) => (q === undefined || c.matchesKeyword(q)) && (modality === undefined || c.props.modality === modality) && (status === undefined || c.props.status === status) && (tag === undefined || c.hasTag(tag)))
			.map((c) => c.toJSON())
			.sort((a, b) => a[sort].localeCompare(b[sort]));
		return { items: matched.slice((p - 1) * size, p * size), page: p, pageSize: size, totalItems: matched.length, totalPages: Math.ceil(matched.length / size) };
	},
});
