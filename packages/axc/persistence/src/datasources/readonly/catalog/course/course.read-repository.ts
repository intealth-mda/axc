import type { CourseModelType } from '@axc/data-sources-mongoose-models';
import { Contexts } from '@axc/domain';
import { courseFixtures } from './course.fixtures.ts';

type CourseEntityReference = Contexts.Catalog.Course.CourseEntityReference;
interface CourseSearch {
	q?: string;
	modality?: CourseEntityReference['modality'];
	status?: CourseEntityReference['status'];
	tag?: string;
	page: number;
	pageSize: number;
	sort: 'title' | 'createdAt' | 'updatedAt';
}
export interface CourseReadRepository {
	search(query: CourseSearch): Promise<{ items: CourseEntityReference[]; totalItems: number }>;
}
export const getCourseReadRepository = (model: CourseModelType): CourseReadRepository => {
	const records = courseFixtures.map((record) => {
		const error = new model(record).validateSync();
		if (error) throw error;
		return new Contexts.Catalog.Course.Course(record);
	});
	return {
		search: (query) => {
			const q = query.q?.toLowerCase();
			const tag = query.tag?.toLowerCase();
			const matches = records
				.filter(
					(course) =>
						(!q || [course.title, course.summary, ...course.tags].some((text) => text.toLowerCase().includes(q))) &&
						(!query.modality || course.modality === query.modality) &&
						(!query.status || course.status === query.status) &&
						(!tag || course.tags.some((value) => value.toLowerCase() === tag)),
				)
				.sort((a, b) => a[query.sort].localeCompare(b[query.sort]) || a.id.localeCompare(b.id));
			return Promise.resolve({ totalItems: matches.length, items: matches.slice((query.page - 1) * query.pageSize, query.page * query.pageSize) });
		},
	};
};
