import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { CourseModality, CourseStatus } from './course.value-objects.ts';

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

export interface CourseEntityReference {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}
