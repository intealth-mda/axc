import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type {
	CourseCatalogVisa,
	CourseModality,
	CoursePassport,
	CourseProps,
	CourseRepository,
	CourseSearchCriteria,
	CourseSearchPage,
	CourseSortField,
	CourseStatus,
} from './domain/contexts/catalog/course/index.ts';
export {
	COURSE_MODALITIES,
	COURSE_PAGE_DEFAULT,
	COURSE_PAGE_SIZE_DEFAULT,
	COURSE_PAGE_SIZE_MAX,
	COURSE_SORT_FIELDS,
	COURSE_STATUSES,
	Course,
	CourseModalityValue,
	CourseStatusValue,
	isCourseModality,
	isCourseSortField,
	isCourseStatus,
	searchCourseCatalog,
} from './domain/contexts/catalog/course/index.ts';
