import type { CourseRepository } from '@axc/domain';
import { COURSE_FIXTURES, createCourseRepository } from '../models/course/index.ts';

export interface DataSources {
	readonlyDataSource: {
		course: CourseRepository;
	};
}

export function buildDataSources(): DataSources {
	return {
		readonlyDataSource: {
			course: createCourseRepository(COURSE_FIXTURES),
		},
	};
}
