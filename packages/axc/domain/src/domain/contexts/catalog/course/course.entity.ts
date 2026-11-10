import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { CourseModalityValue, CourseStatusValue } from './course.value-objects.ts';

export interface CourseDraft {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: string;
	readonly status: string;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModalityValue;
	readonly status: CourseStatusValue;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}
