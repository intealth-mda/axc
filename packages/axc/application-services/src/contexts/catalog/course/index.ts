import type { DataSources } from '@axc/persistence';
import { type CoursePage, queryCourses, type RawCourseQuery } from './query-courses.ts';

export interface CourseApplicationService {
	search(raw: RawCourseQuery): Promise<CoursePage>;
}

/** @public Folder-named factory required by application-services-conventions. */
export const Course = (dataSources: DataSources): CourseApplicationService => ({
	search: (raw: RawCourseQuery): Promise<CoursePage> => queryCourses(dataSources)(raw),
});

export type { CourseItem, CoursePage, CourseQueryErrorBody, CourseQueryErrorDetail, RawCourseQuery } from './query-courses.ts';
export { courseQueryErrorBody, InvalidCourseQueryError } from './query-courses.ts';
