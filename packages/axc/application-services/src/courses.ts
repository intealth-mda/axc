import { Course, type CourseEntityReference, type CourseRepository, isCourseModality, isCourseSortField, isCourseStatus } from '@axc/domain';
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

const intIn = (v: string, min: number, max: number) => /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max;

export const courseService = (courses: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		if (modality !== undefined && !isCourseModality(modality)) details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
		if (!intIn(page, 1, Number.MAX_SAFE_INTEGER)) details.push({ field: 'page', message: 'page must be a positive integer.' });
		if (!intIn(pageSize, 1, 50)) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (!isCourseSortField(sort)) details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
		if (details.length > 0 || (modality !== undefined && !isCourseModality(modality)) || (status !== undefined && !isCourseStatus(status)) || !isCourseSortField(sort)) {
			throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		}
		const p = Number(page);
		const size = Number(pageSize);
		const matched = (await courses.getAll()).filter((c) => c.matches({ q, modality, status, tag })).sort(Course.compare(sort));
		return {
			items: matched.slice((p - 1) * size, p * size).map((c) => c.props),
			page: p,
			pageSize: size,
			totalItems: matched.length,
			totalPages: Math.ceil(matched.length / size),
		};
	},
});
