import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseStatus, CourseTitle, type Modality } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: Modality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;

export interface NewCourseInput {
	title: string;
	summary: string;
	modality: Modality;
	status: CourseStatus;
	tags: string[];
}

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return new Course({ id, ...input, title: new CourseTitle(input.title).value, tags: [...input.tags], createdAt: now, updatedAt: now }, undefined);
	}
	get reference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
