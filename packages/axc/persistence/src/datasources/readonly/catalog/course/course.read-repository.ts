import type { CourseRecord } from '@axc/data-sources-mongoose-models';
import { Catalog } from '@axc/domain';

export interface CourseReadRepository {
	getById(id: string): Promise<Catalog.CourseEntityReference | null>;
	search(query: {
		q?: string | undefined;
		modality?: string | undefined;
		status?: string | undefined;
		tag?: string | undefined;
		page: number;
		pageSize: number;
		sort: 'title' | 'createdAt' | 'updatedAt';
	}): Promise<{ items: Catalog.CourseEntityReference[]; page: number; pageSize: number; totalItems: number; totalPages: number }>;
}
export const CourseReadRepositoryImpl = (records: CourseRecord[]): CourseReadRepository => ({
	getById(id) {
		const course = records.find((x) => x.id === id);
		return Promise.resolve(course ? Catalog.Course.getNewInstance(course).toReference() : null);
	},
	search(query) {
		const q = query.q?.toLowerCase();
		const tag = query.tag?.toLowerCase();
		const filtered = records.filter(
			(x) =>
				(!q || [x.title, x.summary, ...x.tags].some((y) => y.toLowerCase().includes(q))) &&
				(!query.modality || x.modality === query.modality) &&
				(!query.status || x.status === query.status) &&
				(!tag || x.tags.some((y) => y.toLowerCase() === tag)),
		);
		filtered.sort((a, b) => a[query.sort].localeCompare(b[query.sort]) || a.id.localeCompare(b.id));
		return Promise.resolve({
			items: filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize).map((x) => Catalog.Course.getNewInstance(x).toReference()),
			page: query.page,
			pageSize: query.pageSize,
			totalItems: filtered.length,
			totalPages: Math.ceil(filtered.length / query.pageSize),
		});
	},
});
