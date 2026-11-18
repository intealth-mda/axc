import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseSortField, isCourseStatus } from '@axc/domain';
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

const int = (v: string, min: number, max: number) => (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : undefined);

export const buildCourseService = (repo: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CourseSearchResult> {
		const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		const pageNo = int(page, 1, Number.MAX_SAFE_INTEGER);
		const size = int(pageSize, 1, 50);
		if (pageNo === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		if (size === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (!isCourseSortField(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (pageNo === undefined || size === undefined || details.length > 0) throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		const needle = q?.toLowerCase();
		const tagNeedle = tag?.toLowerCase();
		const matches = (await repo.getAll())
			.map((c) => c.toReference())
			.filter(
				(c) =>
					(!needle || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))) &&
					(!modality || c.modality === modality) &&
					(!status || c.status === status) &&
					(!tagNeedle || c.tags.some((t) => t.toLowerCase() === tagNeedle)),
			)
			.sort((a, b) => a[sort as 'title'].localeCompare(b[sort as 'title']));
		return { items: matches.slice((pageNo - 1) * size, pageNo * size), page: pageNo, pageSize: size, totalItems: matches.length, totalPages: Math.ceil(matches.length / size) };
	},
});
