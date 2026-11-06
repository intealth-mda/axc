import { type CourseEntityReference, type CourseRepository, isCourseModality, isCourseSortField, isCourseStatus } from '@axc/domain';
import { ServiceError, type ServiceErrorDetail } from './service-error.ts';

export interface ListCoursesQuery {
	readonly q?: string | undefined;
	readonly modality?: string | undefined;
	readonly status?: string | undefined;
	readonly tag?: string | undefined;
	readonly page?: string | undefined;
	readonly pageSize?: string | undefined;
	readonly sort?: string | undefined;
}

export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

const toInt = (v: string, min: number, max: number): number | undefined => (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : undefined);

export const buildCourseService = (repo: CourseRepository) => ({
	async listCourses(query: ListCoursesQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
		const details: ServiceErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (!isCourseSortField(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		const pageNo = toInt(page, 1, Number.MAX_SAFE_INTEGER);
		if (pageNo === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		const size = toInt(pageSize, 1, 50);
		if (size === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (details.length > 0 || pageNo === undefined || size === undefined || !isCourseSortField(sort)) {
			throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		}

		const needle = q?.toLowerCase();
		const wantTag = tag?.toLowerCase();
		const matches = (await repo.getAll())
			.map((c) => c.toReference())
			.filter(
				(c) =>
					(modality === undefined || c.modality === modality) &&
					(status === undefined || c.status === status) &&
					(wantTag === undefined || c.tags.some((t) => t.toLowerCase() === wantTag)) &&
					(needle === undefined || [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(needle))),
			)
			.sort((a, b) => a[sort].localeCompare(b[sort]));

		return {
			items: matches.slice((pageNo - 1) * size, pageNo * size),
			page: pageNo,
			pageSize: size,
			totalItems: matches.length,
			totalPages: Math.ceil(matches.length / size),
		};
	},
});
