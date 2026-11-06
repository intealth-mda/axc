import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export const queryCourses = (dataSources: DataSources) => async (query: Domain.Contexts.Catalog.Course.CourseSearchQuery) => {
	Domain.Contexts.Catalog.Course.assertCourseSearch(query);
	return await dataSources.readonlyDataSource.Catalog.Course.CourseReadRepo.search(query);
};
