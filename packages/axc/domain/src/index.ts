import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { CourseCatalog, CourseModality, CourseProps, CourseSortField, CourseStatus } from './course.ts';
export { Course, courseModalities, courseSortFields, courseStatuses } from './course.ts';
export type { EnrollmentRequestProps, EnrollmentRequestStatus, EnrollmentRequestStore, EnrollmentStatusChange, SaveEnrollmentRequestResult, StatusHistoryEntry } from './enrollment-request.ts';
export {
	EnrollmentRequest,
	enrollmentEmailsMatch,
	enrollmentRequestStatuses,
	InvalidEnrollmentTransitionError,
	isAllowedEnrollmentTransition,
	isDuplicateActiveEnrollment,
	isEnrollmentRequestStatus,
} from './enrollment-request.ts';
