import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { type CourseQueryByIdCommand, queryById } from './query-by-id.ts';
import { type CourseSearchCommand, search } from './search.ts';

export interface CourseApplicationService {
	queryById: (command: CourseQueryByIdCommand) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference | null>;
	search: (command: CourseSearchCommand) => Promise<Domain.Contexts.Catalog.Course.CourseEntityReference[]>;
}

export const Course = (dataSources: DataSources): CourseApplicationService => {
	return {
		queryById: queryById(dataSources),
		search: search(dataSources),
	};
};
