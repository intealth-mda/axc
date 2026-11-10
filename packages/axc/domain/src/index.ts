import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { CatalogPassport, CatalogReadPermissions } from './domain/contexts/catalog/catalog.passport.ts';
export { catalogReadVisa, systemCatalogPassport } from './domain/contexts/catalog/catalog.passport.ts';
export type {
	CourseModality,
	CourseProps,
	CourseRecord,
	CourseRepository,
	CourseSearchCriteria,
	CourseSearchPage,
	CourseSortField,
	CourseStatus,
} from './domain/contexts/catalog/course/index.ts';
export { Course, CourseEntity, isCourseModality, isCourseSortField, isCourseStatus } from './domain/contexts/catalog/course/index.ts';
