import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { Course, CourseModality, CourseRepository, CourseSort, CourseStatus } from './course.ts';
export { courseModalities, courseSorts, courseStatuses, seedCourses } from './course.ts';
export type { EnrollmentRequest, EnrollmentRequestRepository, EnrollmentStatus, StatusHistoryEntry } from './enrollment-request.ts';
export { enrollmentStatuses } from './enrollment-request.ts';
