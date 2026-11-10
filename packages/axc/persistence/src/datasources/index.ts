import type { CourseRepository } from '@axc/domain';
import { COURSE_SEED } from '../models/course.seed.ts';
import { InMemoryCourseRepository } from './course-memory.ts';

export interface DataSources {
	readonlyDataSource: {
		course: CourseRepository;
	};
}

export function createDataSources(): DataSources {
	return {
		readonlyDataSource: {
			course: new InMemoryCourseRepository(COURSE_SEED),
		},
	};
}
