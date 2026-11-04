import type { Repository } from '@cellix/domain-seedwork/repository';

export type {
	CatalogResult,
	Course,
	CourseModality,
	CourseRepository,
	CourseSearchResult,
	CourseSort,
	CourseStatus,
	EnrollmentRequest,
	EnrollmentRequestRepository,
	EnrollmentStatus,
	RawQuery,
	StatusHistoryEntry,
} from './catalog.ts';
export { changeEnrollmentStatus, createEnrollmentRequest, getEnrollmentRequest, listEnrollmentRequests, searchCourses } from './catalog.ts';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;
