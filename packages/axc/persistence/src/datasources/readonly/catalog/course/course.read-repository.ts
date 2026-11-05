import type { Domain } from '@axc/domain';

type Course = Domain.Contexts.Catalog.Course.Course;
type Query = Domain.Contexts.Catalog.Course.CourseSearchQuery;
type Result = Domain.Contexts.Catalog.Course.CourseSearchResult;
export interface CourseReadRepository {
	search(query: Query): Promise<Result>;
}
export const courseReadRepository = (courses: readonly Course[]): CourseReadRepository => ({
	search(query) {
		const q = query.q?.trim().toLowerCase();
		const tag = query.tag?.trim().toLowerCase();
		const filtered = courses.filter(
			(course) =>
				(!q || [course.title, course.summary, ...course.tags].some((value) => value.toLowerCase().includes(q))) &&
				(query.modality === undefined || course.modality === query.modality) &&
				(query.status === undefined || course.status === query.status) &&
				(!tag || course.tags.some((value) => value.toLowerCase() === tag)),
		);
		const sort = query.sort as 'title' | 'createdAt' | 'updatedAt';
		filtered.sort((a, b) => a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id));
		const start = (query.page - 1) * query.pageSize;
		return Promise.resolve({
			items: filtered.slice(start, start + query.pageSize).map((course) => ({ ...course, tags: [...course.tags] })),
			page: query.page,
			pageSize: query.pageSize,
			totalItems: filtered.length,
			totalPages: Math.ceil(filtered.length / query.pageSize),
		});
	},
});
