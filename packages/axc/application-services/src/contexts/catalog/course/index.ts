import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { type CourseQueryByIdCommand, queryById } from './query-by-id.ts';
import { type CourseSearchCoursesCommand, searchCourses } from './search-courses.ts';

export interface CourseApplicationService {
	queryById: (command: CourseQueryByIdCommand) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null>;
	searchCourses: (command: CourseSearchCoursesCommand) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
}

export const Course = (dataSources: DataSources): CourseApplicationService => {
	return {
		queryById: queryById(dataSources),
		searchCourses: searchCourses(dataSources),
	};
};
