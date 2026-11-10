import type { DataSources } from '@axc/persistence';
import { type CourseSearchOutcome, findCourses } from './find-courses.ts';

export type { CourseSearchOutcome } from './find-courses.ts';

export interface CourseApplicationService {
	search(queryString: string): Promise<CourseSearchOutcome>;
}

/** @public Folder-named factory required by application-services-conventions. */
export const Course = (dataSources: DataSources): CourseApplicationService => {
	const searchCourses = findCourses(dataSources);
	return {
		search(queryString: string): Promise<CourseSearchOutcome> {
			return searchCourses(queryString);
		},
	};
};
