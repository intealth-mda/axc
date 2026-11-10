import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Course } from './course.aggregate.ts';
import type { CourseModality, CourseStatus } from './course.entity.ts';

export type CourseSortField = 'title' | 'createdAt' | 'updatedAt';

export function isCourseSortField(value: string): value is CourseSortField {
	return value === 'title' || value === 'createdAt' || value === 'updatedAt';
}

export interface CourseSearchCriteria {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSortField;
}

export interface CourseRecord {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CourseSearchPage {
	readonly items: CourseRecord[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

export interface CourseRepository extends DomainSeedwork.Repository<Course> {
	search(criteria: CourseSearchCriteria): Promise<CourseSearchPage>;
}
