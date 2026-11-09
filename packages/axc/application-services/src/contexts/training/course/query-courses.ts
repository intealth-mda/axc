import { Domain } from '@axc/domain';
import type { CoursePage, DataSources } from '@axc/persistence';
export const queryCourses =
	(dataSources: DataSources) =>
	async (query: Domain.Contexts.Training.Course.CourseSearchQuery): Promise<CoursePage> => {
		Domain.Contexts.Training.Course.assertCourseSearch(query);
		return await dataSources.readonlyDataSource.Training.Course.CourseReadRepo.search(query);
	};
