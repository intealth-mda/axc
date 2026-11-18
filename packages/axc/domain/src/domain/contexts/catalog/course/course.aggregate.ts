import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseStatus, CourseTags, CourseTitle, type Modality } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: Modality;
	status: CourseStatus;
	tags: readonly string[];
	createdAt: string;
	updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;

export interface NewCourseInput {
	title: string;
	summary: string;
	modality: Modality;
	status: CourseStatus;
	tags: readonly string[];
}

export class Course extends AggregateRoot<CourseProps, undefined> implements CourseEntityReference {
	static getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return new Course({
			id,
			title: new CourseTitle(input.title).value,
			summary: input.summary,
			modality: input.modality,
			status: input.status,
			tags: new CourseTags(input.tags).value,
			createdAt: now,
			updatedAt: now,
		});
	}

	constructor(props: CourseProps) {
		super(props, undefined);
	}
	get title(): string {
		return this.props.title;
	}
	get summary(): string {
		return this.props.summary;
	}
	get modality(): Modality {
		return this.props.modality;
	}
	get status(): CourseStatus {
		return this.props.status;
	}
	get tags(): readonly string[] {
		return this.props.tags;
	}
	get createdAt(): string {
		return this.props.createdAt;
	}
	get updatedAt(): string {
		return this.props.updatedAt;
	}
}
