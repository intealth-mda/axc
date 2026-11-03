import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { Course, CourseModality, CoursePage, CourseQuery, CourseQueryDetail, CourseQueryErrorBody, CourseQueryInput, CourseQueryResult, CourseSort, CourseStatus } from './course.ts';
export { parseCourseQuery, searchCourses } from './course.ts';
