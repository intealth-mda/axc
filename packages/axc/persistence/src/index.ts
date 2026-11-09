import type { DataSources } from './datasources/index.ts';
import { createCourseReadRepository } from './datasources/readonly/catalog/course/course.read-repository.ts';
import { courses } from './seed/catalog/course.ts';

export type { DataSources } from './datasources/index.ts';
export type { CoursePage } from './datasources/readonly/catalog/course/course.read-repository.ts';
export interface DataSourcesFactory {
	withSystemPassport(): DataSources;
}
export const Persistence = (): DataSourcesFactory => ({ withSystemPassport: () => ({ readonlyDataSource: { Catalog: { Course: { CourseReadRepo: createCourseReadRepository(courses) } } } }) });
export type { UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
