import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';

export const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
export type CourseModality = (typeof COURSE_MODALITIES)[number];

export const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export interface CourseProps extends DomainEntityProps {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export function isCourseModality(value: string): value is CourseModality {
	return COURSE_MODALITIES.some((item) => item === value);
}

export function isCourseStatus(value: string): value is CourseStatus {
	return COURSE_STATUSES.some((item) => item === value);
}
