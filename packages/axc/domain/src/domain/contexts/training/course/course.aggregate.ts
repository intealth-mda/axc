import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { requiredText } from '../errors.ts';
import { CourseModality, CourseStatus } from './course.value-objects.ts';
export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
export interface CourseEntityReference extends Readonly<Omit<CourseProps, 'tags'>> {
	readonly tags: readonly string[];
}
export class Course extends AggregateRoot<CourseProps, undefined> implements CourseEntityReference {
	static getNewInstance(props: CourseProps): Course {
		return new Course(
			{
				...props,
				id: requiredText(props.id, 'id'),
				title: requiredText(props.title, 'title'),
				summary: requiredText(props.summary, 'summary'),
				modality: new CourseModality(props.modality).value,
				status: new CourseStatus(props.status).value,
				tags: [...props.tags],
			},
			undefined,
		);
	}
	get title(): string {
		return this.props.title;
	}
	get summary(): string {
		return this.props.summary;
	}
	get modality(): string {
		return this.props.modality;
	}
	get status(): string {
		return this.props.status;
	}
	get tags(): readonly string[] {
		return [...this.props.tags];
	}
	get createdAt(): string {
		return this.props.createdAt;
	}
	get updatedAt(): string {
		return this.props.updatedAt;
	}
}
