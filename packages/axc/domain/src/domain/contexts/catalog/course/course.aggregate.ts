import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { Modality, Status } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: ReturnType<Modality['valueOf']>;
	status: ReturnType<Status['valueOf']>;
	tags: readonly string[];
	createdAt: string;
	updatedAt: string;
}
export type CourseEntityReference = Readonly<CourseProps>;
export class Course extends AggregateRoot<CourseProps, undefined> implements CourseEntityReference {
	constructor(props: CourseProps) {
		super(Object.freeze({ ...props, tags: Object.freeze([...props.tags]) }), undefined);
	}
	static getNewInstance(props: CourseProps): Course {
		if (!props.id.trim() || !props.title.trim() || !props.summary.trim()) throw new Error('Course text is required');
		if (!props.tags.every((tag) => typeof tag === 'string' && tag.trim().length > 0)) throw new Error('Invalid course tags');
		for (const date of [props.createdAt, props.updatedAt]) {
			if (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString() !== date) throw new Error('Invalid course timestamp');
		}
		if (props.updatedAt < props.createdAt) throw new Error('updatedAt precedes createdAt');
		return new Course({ ...props, modality: new Modality(props.modality).valueOf(), status: new Status(props.status).valueOf() });
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
}
