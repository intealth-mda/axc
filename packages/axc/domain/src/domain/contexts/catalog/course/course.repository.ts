import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Course } from './course.aggregate.ts';
import type { CourseModality, CourseStatus } from './course.entity.ts';

export const COURSE_SORT_FIELDS = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

export const COURSE_PAGE_DEFAULT = 1;
export const COURSE_PAGE_SIZE_DEFAULT = 10;
export const COURSE_PAGE_SIZE_MAX = 50;

export interface CourseSearchCriteria {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSortField;
}

export interface CourseSearchPage {
	readonly items: readonly Course[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export interface CourseRepository extends DomainSeedwork.Repository<Course> {
	search(criteria: CourseSearchCriteria): Promise<CourseSearchPage>;
}

export function isCourseSortField(value: string): value is CourseSortField {
	return COURSE_SORT_FIELDS.some((item) => item === value);
}
