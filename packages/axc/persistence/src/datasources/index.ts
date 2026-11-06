import { createCourseReadRepository } from './readonly/catalog/course/course.read-repository.ts';
import type { ReadonlyDataSource } from './readonly/index.ts';
export interface DataSources {
	readonlyDataSource: ReadonlyDataSource;
}
export interface DataSourcesFactory {
	withSystemPassport(): DataSources;
}
export const Persistence = (): DataSourcesFactory => {
	const dataSources: DataSources = { readonlyDataSource: { Catalog: { Course: { CourseReadRepo: createCourseReadRepository() } } } };
	return { withSystemPassport: () => dataSources };
};
