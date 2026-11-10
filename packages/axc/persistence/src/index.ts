import { createCourseReadStore } from './datasources/course-catalog.ts';
import type { DataSources } from './datasources/data-sources.ts';

export type { UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
export type { DataSources } from './datasources/data-sources.ts';

export function createDataSources(): DataSources {
	return {
		readonlyDataSource: {
			course: createCourseReadStore(),
		},
	};
}
