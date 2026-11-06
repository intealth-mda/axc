import type { Domain } from '@axc/domain';
import { courses } from '../../../../seed/catalog/course.ts';

type CourseEntityReference = Domain.Contexts.Catalog.Course.CourseEntityReference;
type CourseSearchQuery = Domain.Contexts.Catalog.Course.CourseSearchQuery;
export interface CoursePage {
	items: CourseEntityReference[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
export interface CourseReadRepository {
	search(query: CourseSearchQuery): Promise<CoursePage>;
}
export const createCourseReadRepository = (): CourseReadRepository => ({
	search(query) {
		const keyword = query.q?.toLowerCase();
		const matches = courses.filter(
			(course) =>
				(keyword === undefined || [course.title, course.summary, ...course.tags].some((value) => value.toLowerCase().includes(keyword))) &&
				(query.modality === undefined || course.modality === query.modality) &&
				(query.status === undefined || course.status === query.status) &&
				(query.tag === undefined || course.tags.some((tag) => tag.toLowerCase() === query.tag?.toLowerCase())),
		);
		const sort = query.sort as 'title' | 'createdAt' | 'updatedAt';
		matches.sort((a, b) => a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id));
		const start = (query.page - 1) * query.pageSize;
		return Promise.resolve({
			items: matches.slice(start, start + query.pageSize).map((course) => ({ ...course, tags: [...course.tags] })),
			page: query.page,
			pageSize: query.pageSize,
			totalItems: matches.length,
			totalPages: Math.ceil(matches.length / query.pageSize),
		});
	},
});
