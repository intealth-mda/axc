import type { Domain } from '@axc/domain';

type Course = Domain.Contexts.Catalog.Course.CourseEntityReference;
type Query = Domain.Contexts.Catalog.Course.CourseSearchQuery;
export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
export interface CourseReadRepository {
	search(query: Query): Promise<CoursePage>;
}
export const createCourseReadRepository = (courses: readonly Course[]): CourseReadRepository => ({
	search(query) {
		const q = query.q?.toLowerCase();
		const tag = query.tag?.toLowerCase();
		const matches = courses.filter(
			(course) =>
				(!q || [course.title, course.summary, ...course.tags].some((text) => text.toLowerCase().includes(q))) &&
				(query.modality === undefined || course.modality === query.modality) &&
				(query.status === undefined || course.status === query.status) &&
				(tag === undefined || course.tags.some((value) => value.toLowerCase() === tag)),
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
