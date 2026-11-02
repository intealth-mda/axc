import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { type CourseSearchCoursesCommand, searchCourses } from './search-courses.ts';

export interface CourseApplicationService {
	searchCourses: (command: CourseSearchCoursesCommand) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
}

export const Course = (dataSources: DataSources): CourseApplicationService => {
	return {
		searchCourses: searchCourses(dataSources),
	};
};
