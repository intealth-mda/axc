import type { DataSources } from '@axc/persistence';
import { type CourseSearchQuery, search } from './search.ts';

export type { CourseSearchQuery } from './search.ts';
export interface CourseApplicationService {
	search(query: CourseSearchQuery): ReturnType<ReturnType<typeof search>>;
}
export const Course = (dataSources: DataSources): CourseApplicationService => ({ search: search(dataSources) });
