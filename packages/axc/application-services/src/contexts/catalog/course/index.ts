import type { Domain } from '@axc/domain';
import type { CoursePage, DataSources } from '@axc/persistence';
import { queryCourses } from './query-courses.ts';
export interface CourseApplicationService {
	queryCourses(query: Domain.Contexts.Catalog.Course.CourseSearchQuery): Promise<CoursePage>;
}
export const Course = (dataSources: DataSources): CourseApplicationService => ({ queryCourses: queryCourses(dataSources) });
