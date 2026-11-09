import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { queryCourses } from './query-courses.ts';
export interface CourseApplicationService {
	queryCourses: (query: Domain.Contexts.Training.Course.CourseSearchQuery) => ReturnType<ReturnType<typeof queryCourses>>;
}
export const Course = (dataSources: DataSources): CourseApplicationService => ({ queryCourses: queryCourses(dataSources) });
