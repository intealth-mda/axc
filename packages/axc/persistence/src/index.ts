export type { UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';

import type { DataSourcesFactory } from './datasources/index.ts';
import { courseReadRepository } from './datasources/readonly/catalog/course/course.read-repository.ts';
import { courses } from './seed/catalog/course.ts';

export type { DataSources, DataSourcesFactory } from './datasources/index.ts';
export const Persistence = (): DataSourcesFactory => ({
	withSystemPassport: () => ({ readonlyDataSource: { Catalog: { Course: { CourseReadRepo: courseReadRepository(courses) } } } }),
});
