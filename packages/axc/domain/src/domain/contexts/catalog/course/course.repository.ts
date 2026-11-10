import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Course } from './course.aggregate.ts';

export type CourseSort = 'title' | 'createdAt' | 'updatedAt';

export interface CourseSearchCriteria {
	readonly q?: string;
	readonly modality?: string;
	readonly status?: string;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSort;
}

export interface CourseSearchResult {
	readonly items: readonly Course[];
	readonly totalItems: number;
}

export interface CourseRepository extends DomainSeedwork.Repository<Course> {
	search(criteria: CourseSearchCriteria): Promise<CourseSearchResult>;
}
