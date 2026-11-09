import type { DataSources } from '@axc/persistence';
import { type CoursePage, type CourseSearchQuery, search } from './search.ts';
export interface CourseApplicationService {
	search(query: CourseSearchQuery): Promise<CoursePage>;
}
export const Course = (dataSources: DataSources): CourseApplicationService => ({ search: search(dataSources) });
