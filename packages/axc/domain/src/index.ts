import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type {
	CourseDraft,
	CourseModalityValue,
	CoursePassport,
	CourseProps,
	CourseRepository,
	CourseSearchCriteria,
	CourseSearchResult,
	CourseSort,
	CourseStatusValue,
} from './domain/contexts/catalog/course/index.ts';
export { Course } from './domain/contexts/catalog/course/index.ts';
