import type { DataSources } from '@axc/persistence';
import type { CourseSearchRawQuery, CourseSearchResult } from './query-courses.ts';
import { searchCourses } from './query-courses.ts';

export interface CourseApplicationService {
	search(query: CourseSearchRawQuery): Promise<CourseSearchResult>;
}

/** @public Folder-named factory required by application-services-conventions. */
export const Course = (dataSources: DataSources): CourseApplicationService => ({
	search: searchCourses(dataSources),
});

export type { CourseQueryFieldError, CourseRecord, CourseSearchRawQuery, CourseSearchResult } from './query-courses.ts';
export { INVALID_COURSE_QUERY_CODE, INVALID_COURSE_QUERY_MESSAGE, InvalidCourseQueryError } from './query-courses.ts';
