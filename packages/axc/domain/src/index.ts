import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { CatalogPassport } from './domain/contexts/catalog/catalog.passport.ts';
export type { CourseModality, CourseProps, CourseRepository, CourseStatus } from './domain/contexts/catalog/course/index.ts';
export { Course, CourseModalityValue, CourseStatusValue } from './domain/contexts/catalog/course/index.ts';
