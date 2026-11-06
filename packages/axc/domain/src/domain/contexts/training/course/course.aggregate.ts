import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { invalid, text } from '../../../errors.ts';
import { CourseStatus, Modality } from './course.value-objects.ts';
export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: 'online' | 'in-person' | 'hybrid';
	status: 'draft' | 'active' | 'retired';
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
export interface CourseEntityReference extends Readonly<Omit<CourseProps, 'tags'>> {
	readonly tags: readonly string[];
}
export class Course extends AggregateRoot<CourseProps, undefined> implements CourseEntityReference {
	static getNewInstance(props: CourseProps): Course {
		text(props.id, 'id');
		text(props.title, 'title');
		text(props.summary, 'summary');
		new Modality(props.modality);
		new CourseStatus(props.status);
		if (!Array.isArray(props.tags) || props.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) invalid('tags', 'Invalid tags.');
		if (!Number.isFinite(Date.parse(props.createdAt)) || !Number.isFinite(Date.parse(props.updatedAt))) invalid('createdAt', 'Invalid timestamps.');
		return new Course(structuredClone(props), undefined);
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
}
