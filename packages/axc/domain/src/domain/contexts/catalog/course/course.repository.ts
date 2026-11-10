import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Course } from './course.aggregate.ts';
import type { CourseModality, CourseProps, CourseSortField, CourseStatus } from './course.entity.ts';

export interface CourseSearchCriteria {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSortField;
}

export interface CourseSearchResult {
	readonly items: readonly CourseProps[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export interface CourseRepository extends DomainSeedwork.Repository<Course> {
	search(criteria: CourseSearchCriteria): Promise<CourseSearchResult>;
}
