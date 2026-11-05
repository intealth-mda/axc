import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { CourseModality, CourseStatus, type Modality, type Status } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: Modality;
	status: Status;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;
export type CourseInput = Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>;

export class Course extends AggregateRoot<CourseProps, unknown> {
	static getNewInstance(id: string, input: CourseInput, now: string): Course {
		return new Course(
			{
				...input,
				id,
				modality: new CourseModality(input.modality).value,
				status: new CourseStatus(input.status).value,
				createdAt: now,
				updatedAt: now,
			},
			undefined,
		);
	}

	get reference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
