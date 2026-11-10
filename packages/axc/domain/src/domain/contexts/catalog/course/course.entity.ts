import { DomainEntity, type DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';

export type CourseModality = 'online' | 'in-person' | 'hybrid';
export type CourseStatus = 'draft' | 'active' | 'retired';

export function isCourseModality(value: string): value is CourseModality {
	return value === 'online' || value === 'in-person' || value === 'hybrid';
}

export function isCourseStatus(value: string): value is CourseStatus {
	return value === 'draft' || value === 'active' || value === 'retired';
}

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export class CourseEntity extends DomainEntity<CourseProps> {}
