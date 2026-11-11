import type { DataSources } from '@axc/persistence';
import { type CoursePage, type CourseSearchQuery, queryCourses } from './query-courses.ts';

export interface CourseApplicationService {
	search(query: CourseSearchQuery): Promise<CoursePage>;
}

/** @public Folder-named factory required by application-services-conventions. */
export const Course = (dataSources: DataSources): CourseApplicationService => ({
	search: queryCourses(dataSources),
});
