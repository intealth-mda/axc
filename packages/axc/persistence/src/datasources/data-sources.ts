import type { CourseSearchCriteria, CourseSearchResult } from '@axc/domain';

export interface CourseReadStore {
	search(criteria: CourseSearchCriteria): Promise<CourseSearchResult>;
}

export interface DataSources {
	readonlyDataSource: {
		readonly course: CourseReadStore;
	};
}
