import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Course } from './course.aggregate.ts';
import type { CourseModality, CourseSort, CourseStatus } from './course.value-objects.ts';

export interface CourseSearchCriteria {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSort;
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
