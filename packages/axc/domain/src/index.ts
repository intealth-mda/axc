import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { CourseEntityReference, CoursePassport, CourseProps, CourseRepository, CourseSearchCriteria, CourseSearchPage, CourseVisa } from './domain/contexts/catalog/course/index.ts';
export {
	COURSE_MODALITIES,
	COURSE_SORTS,
	COURSE_STATUSES,
	Course,
	type CourseModality,
	type CourseSort,
	type CourseStatus,
	DEFAULT_COURSE_PAGE,
	DEFAULT_COURSE_PAGE_SIZE,
	MAX_COURSE_PAGE_SIZE,
	searchCourses,
} from './domain/contexts/catalog/course/index.ts';
