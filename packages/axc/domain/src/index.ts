import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export { type CatalogPassport, systemCatalogPassport } from './domain/contexts/catalog/catalog.passport.ts';
export { Course, type CourseModality, type CourseProps, type CourseRepository, type CourseStatus, CourseTagList, courseModalities, courseStatuses } from './domain/contexts/catalog/course/index.ts';
