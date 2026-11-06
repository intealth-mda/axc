import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { CourseModality, CourseStatus } from './course.value-objects.ts';
export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
export type CourseEntityReference = Readonly<CourseProps>;
