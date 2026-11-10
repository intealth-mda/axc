import type { DataSources } from '@axc/persistence';
import { type CourseSearchPage, queryCourses } from './query-courses.ts';

export interface CourseApplicationService {
	searchCourses(query: Readonly<Record<string, readonly string[]>>): Promise<CourseSearchPage>;
}

export type { CourseSearchPage } from './query-courses.ts';
export { InvalidCourseQueryError } from './query-courses.ts';

/** @public Folder-named factory required by application-services-conventions. */
export const Course = (dataSources: DataSources): CourseApplicationService => ({
	searchCourses: queryCourses(dataSources),
});
