import type { Course } from './course.ts';

/** Read model for the training course catalog. */
export interface CourseCatalog {
	listCourses(): Promise<readonly Course[]>;
}
