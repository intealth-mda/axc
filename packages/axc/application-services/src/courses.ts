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

const SORTS: readonly string[] = ['title', 'createdAt', 'updatedAt'];
const isSort = (value: string): value is 'title' | 'createdAt' | 'updatedAt' => SORTS.includes(value);
const toInt = (value: string, min: number, max: number) => (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= max ? Number(value) : undefined);

export const buildCourseService = (courses: CourseRepository) => ({
	async search(query: CourseSearchQuery): Promise<CoursePage> {
		const { q, modality, status, tag, page = '1', pageSize = '10', sort = 'title' } = query;
		const details: ErrorDetail[] = [];
		const pageNumber = toInt(page, 1, Number.MAX_SAFE_INTEGER);
		const size = toInt(pageSize, 1, 50);
		if (pageNumber === undefined) details.push({ field: 'page', message: 'page must be a positive integer.' });
		if (size === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (modality !== undefined && !isModality(modality)) details.push({ field: 'modality', message: 'modality must be online, in-person or hybrid.' });
		if (status !== undefined && !isCourseStatus(status)) details.push({ field: 'status', message: 'status must be draft, active or retired.' });
		if (!isSort(sort)) details.push({ field: 'sort', message: 'sort must be title, createdAt or updatedAt.' });
		if (pageNumber === undefined || size === undefined || !isSort(sort) || details.length > 0) {
			throw new ServiceError('INVALID_QUERY_PARAMETER', 'One or more query parameters are invalid.', details);
		}

		const keyword = q?.toLowerCase();
		const tagNeedle = tag?.toLowerCase();
		const matches = (await courses.getAll())
			.map((course) => course.props)
			.filter(
				(c) =>
					(modality === undefined || c.modality === modality) &&
					(status === undefined || c.status === status) &&
					(tagNeedle === undefined || c.tags.some((t) => t.toLowerCase() === tagNeedle)) &&
					(!keyword || [c.title, c.summary, ...c.tags].some((text) => text.toLowerCase().includes(keyword))),
			)
			.sort((a, b) => a[sort].localeCompare(b[sort]));

		return {
			items: matches.slice((pageNumber - 1) * size, pageNumber * size),
			page: pageNumber,
			pageSize: size,
			totalItems: matches.length,
			totalPages: Math.ceil(matches.length / size),
		};
	},
});
