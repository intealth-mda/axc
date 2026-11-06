import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export const queryCourses = (dataSources: DataSources) => async (query: Domain.Contexts.Catalog.Course.CourseSearchQuery) => {
	const details = Domain.Contexts.Catalog.Course.validateCourseQuery(query);
	if (details.length) throw new Error('Invalid course search query');
	return await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.search(query);
};
