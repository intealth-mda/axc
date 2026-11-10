import type { CourseRepository } from '@axc/domain';
import { createCourseCatalogRepository } from './catalog/course/index.ts';

export interface DataSources {
	readonlyDataSource: {
		readonly course: CourseRepository;
	};
	domainDataSource: {
		readonly course: CourseRepository;
	};
}

export function createDataSources(): DataSources {
	const course = createCourseCatalogRepository();
	return {
		readonlyDataSource: { course },
		domainDataSource: { course },
	};
}
