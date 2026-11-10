import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type {
	CatalogReadPermissions,
	CourseModality,
	CourseProps,
	CourseRepository,
	CourseSearchCriteria,
	CourseSearchResult,
	CourseSortField,
	CourseStatus,
} from './domain/contexts/catalog/course/index.ts';
export { CatalogPassport, COURSE_MODALITIES, COURSE_SORT_FIELDS, COURSE_STATUSES, Course } from './domain/contexts/catalog/course/index.ts';
