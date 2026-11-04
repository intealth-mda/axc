import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { Course, CourseModality, CoursePage, CourseSearchQuery, CourseSort, CourseStatus } from './course.ts';
export { COURSE_MODALITIES, COURSE_SORTS, COURSE_STATUSES, searchCourses } from './course.ts';
