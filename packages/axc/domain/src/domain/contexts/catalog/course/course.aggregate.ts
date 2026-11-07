import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseStatus, Modality, Status } from './course.value-objects.ts';
export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
export interface CourseEntityReference extends Readonly<CourseProps> {}
export class Course extends AggregateRoot<CourseProps, undefined> implements CourseEntityReference {
	static getNewInstance(props: CourseProps): Course {
		return new Course({ ...props, modality: new Modality(props.modality).valueOf(), status: new Status(props.status).valueOf(), tags: [...props.tags] }, undefined);
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
		return [...this.props.tags];
	}
	get createdAt() {
		return this.props.createdAt;
	}
	get updatedAt() {
		return this.props.updatedAt;
	}
	toReference(): CourseEntityReference {
		return { id: this.id, title: this.title, summary: this.summary, modality: this.modality, status: this.status, tags: this.tags, createdAt: this.createdAt, updatedAt: this.updatedAt };
	}
}
