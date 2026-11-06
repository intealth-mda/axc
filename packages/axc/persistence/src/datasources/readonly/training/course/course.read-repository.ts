import type { Domain } from '@axc/domain';

type Course = Domain.Contexts.Training.Course.CourseEntityReference;
type Query = Domain.Contexts.Training.Course.CourseSearchQuery;
export interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
export interface CourseReadRepository {
	search(query: Query): Promise<CoursePage>;
	getById(id: string): Promise<Course | undefined>;
}
export const courseReadRepository = (courses: readonly Course[]): CourseReadRepository => ({
	getById: (id) => Promise.resolve(structuredClone(courses.find((course) => course.id === id))),
	search: (query) => {
		const q = query.q?.trim().toLowerCase();
		const tag = query.tag?.trim().toLowerCase();
		const filtered = courses.filter(
			(course) =>
				(!q || [course.title, course.summary, ...course.tags].some((text) => text.toLowerCase().includes(q))) &&
				(!query.modality || course.modality === query.modality) &&
				(!query.status || course.status === query.status) &&
				(!tag || course.tags.some((value) => value.toLowerCase() === tag)),
		);
		const field = query.sort as 'title' | 'createdAt' | 'updatedAt';
		filtered.sort((a, b) => a[field].localeCompare(b[field]) || a.id.localeCompare(b.id));
		const start = (query.page - 1) * query.pageSize;
		return Promise.resolve({
			items: structuredClone(filtered.slice(start, start + query.pageSize)),
			page: query.page,
			pageSize: query.pageSize,
			totalItems: filtered.length,
			totalPages: Math.ceil(filtered.length / query.pageSize),
		});
	},
});
