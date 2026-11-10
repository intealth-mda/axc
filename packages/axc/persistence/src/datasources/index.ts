import type { CourseRepository } from '@axc/domain';
import { createCourseRepository } from '../models/course/index.ts';

export interface ReadonlyDataSource {
	readonly course: CourseRepository;
}

export interface DataSources {
	readonly readonlyDataSource: ReadonlyDataSource;
}

export function createDataSources(): DataSources {
	return {
		readonlyDataSource: {
			course: createCourseRepository(),
		},
	};
}
