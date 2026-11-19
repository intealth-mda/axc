import type { CourseEntityReference } from '@axc/domain';
import type { DataSources } from './data-sources.ts';
import { type CourseQueryByIdCommand, queryById } from './query-by-id.ts';
import { type CoursePage, type CourseSearchCommand, search } from './search.ts';

export interface CourseApplicationService {
	queryById: (command: CourseQueryByIdCommand) => Promise<CourseEntityReference | null>;
	search: (command: CourseSearchCommand) => Promise<CoursePage>;
}

export const Course = (dataSources: DataSources): CourseApplicationService => ({
	queryById: queryById(dataSources),
	search: search(dataSources),
});
