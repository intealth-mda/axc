import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseStatus, CourseStatuses, CourseTitle } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;
export type NewCourseInput = Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(id: string, input: NewCourseInput, now: string): Course {
		return new Course({ id, ...input, title: new CourseTitle(input.title).value, tags: [...input.tags], createdAt: now, updatedAt: now });
	}
	static fromProps(props: CourseProps): Course {
		return new Course(props);
	}
	private constructor(props: CourseProps) {
		super(props, undefined);
	}
	get isActive(): boolean {
		return this.props.status === CourseStatuses.active;
	}
	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
