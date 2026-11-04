import type { Repository } from '@cellix/domain-seedwork/repository';

export type {
	Course,
	CourseModality,
	CoursePage,
	CourseRepository,
	CourseSortField,
	CourseStatus,
	EnrollmentRequest,
	EnrollmentRequestRepository,
	EnrollmentStatus,
	StatusHistoryEntry,
} from './catalog.ts';
export { isCourseModality, isCourseSortField, isCourseStatus, isEnrollmentStatus, seedCourses } from './catalog.ts';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;
