import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { CourseModality, CourseProps, CourseStatus } from './course.ts';
export { COURSE_MODALITIES, COURSE_STATUSES, Course } from './course.ts';
export type { CourseCatalog } from './course-catalog.ts';
export { COURSE_CATALOG_SEED } from './course-catalog-seed.ts';
export type { EnrollmentRequestProps, EnrollmentRequestStatus, EnrollmentStatusChange, OpenEnrollmentRequest, StatusHistoryEntry } from './enrollment-request.ts';
export {
	ENROLLMENT_REQUEST_CREATED_BY,
	ENROLLMENT_REQUEST_STATUSES,
	EnrollmentRequest,
	EnrollmentRequestInvariantError,
	EnrollmentStatusTransitionError,
	isJustificationLength,
	isLearnerEmail,
	JUSTIFICATION_MAX_LENGTH,
	JUSTIFICATION_MIN_LENGTH,
	learnerEmailsMatch,
} from './enrollment-request.ts';
export type { AddEnrollmentRequestResult, EnrollmentRequestStore, NewEnrollmentRequest } from './enrollment-request-store.ts';
