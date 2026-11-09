import type { CourseEntityReference } from '@axc/domain';
import type { MemoryStore } from '../../../store.ts';

interface CourseSearch {
	q?: string;
	modality?: string;
	status?: string;
	tag?: string;
	page: number;
	pageSize: number;
	sort: 'title' | 'createdAt' | 'updatedAt';
}
export interface CourseReadRepository {
	getById(id: string): Promise<CourseEntityReference | undefined>;
	search(query: CourseSearch): Promise<{ items: CourseEntityReference[]; page: number; pageSize: number; totalItems: number; totalPages: number }>;
}
export const getCourseReadRepository = (store: MemoryStore): CourseReadRepository => ({
	getById: async (id) => {
		const record = store.courses.get(id);
		return await Promise.resolve(record ? structuredClone(record) : undefined);
	},
	search: async (query) => {
		const rows = [...store.courses.values()]
			.filter(
				(course) =>
					(!query.q || [course.title, course.summary, ...course.tags].some((value) => value.toLowerCase().includes(query.q?.toLowerCase() ?? ''))) &&
					(!query.modality || course.modality === query.modality) &&
					(!query.status || course.status === query.status) &&
					(!query.tag || course.tags.some((tag) => tag.toLowerCase() === query.tag?.toLowerCase())),
			)
			.sort((a, b) => a[query.sort].localeCompare(b[query.sort]) || a.id.localeCompare(b.id));
		return await Promise.resolve({
			items: structuredClone(rows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize)),
			page: query.page,
			pageSize: query.pageSize,
			totalItems: rows.length,
			totalPages: Math.ceil(rows.length / query.pageSize),
		});
	},
});
