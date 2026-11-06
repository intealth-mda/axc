import type { CourseReadRepository } from './course/course.read-repository.ts';
export interface CatalogDataSource {
	Course: { CourseReadRepo: CourseReadRepository };
}
