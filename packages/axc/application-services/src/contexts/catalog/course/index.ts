import type { DataSources } from '@axc/persistence';
import { type CourseCatalogPage, findCourses } from './find-courses.ts';

export interface CourseApplicationService {
	findCourses(query: Parameters<ReturnType<typeof findCourses>>[0]): Promise<CourseCatalogPage>;
}

export const Course = (dataSources: DataSources): CourseApplicationService => {
	const search = findCourses(dataSources);
	return {
		findCourses(query): Promise<CourseCatalogPage> {
			return search(query);
		},
	};
};

export type { CourseCatalogPage, CourseQueryErrorBody, CourseRecord, ParseCourseQueryResult, RawCourseQuery } from './find-courses.ts';
export { parseCourseQuery } from './find-courses.ts';
