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

export class Course extends AggregateRoot<CourseProps, undefined> implements CourseEntityReference {
	static getNewInstance(props: CourseProps): Course {
		if (props.title.trim() === '') throw new Error('title is required.');
		new CourseModality(props.modality);
		new CourseStatus(props.status);
		return new Course({ ...props, tags: [...props.tags] }, undefined);
	}
	get title() {
		return this.props.title;
	}
	get summary() {
		return this.props.summary;
	}
	get modality() {
		return this.props.modality;
	}
	get status() {
		return this.props.status;
	}
	get tags() {
		return this.props.tags;
	}
	get createdAt() {
		return this.props.createdAt;
	}
	get updatedAt() {
		return this.props.updatedAt;
	}
	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
