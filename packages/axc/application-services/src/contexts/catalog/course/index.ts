import type { DataSources } from '@axc/persistence';
import type { CourseQueryErrorBody, CourseQueryFieldError, CourseQueryInput, CourseQueryOutcome } from './query-courses.ts';
import { queryCourses } from './query-courses.ts';

export interface CourseApplicationService {
	query(input: CourseQueryInput): Promise<CourseQueryOutcome>;
}

/** @public Folder-named factory required by application-services-conventions. */
export const Course = (dataSources: DataSources): CourseApplicationService => ({
	query: queryCourses(dataSources),
});

export type { CourseQueryErrorBody, CourseQueryFieldError, CourseQueryInput, CourseQueryOutcome };
