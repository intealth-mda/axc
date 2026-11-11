import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseStatus, CourseStatuses } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(props: CourseProps): Course {
		return new Course({ ...props, tags: [...props.tags] }, undefined);
	}

	get isActive(): boolean {
		return this.props.status === CourseStatuses.Active;
	}

	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
