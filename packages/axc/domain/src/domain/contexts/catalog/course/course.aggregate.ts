import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { CourseTitle, type Modality, type Status } from './course.value-objects.ts';

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
export type NewCourseInput = Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return new Course({ ...input, id, title: new CourseTitle(input.title).value, createdAt: now, updatedAt: now }, undefined);
	}
	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
