import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseStatus, CourseTitle } from './course.value-objects.ts';

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
		return new Course({ ...input, id, title: new CourseTitle(input.title).value, tags: [...input.tags], createdAt: now, updatedAt: now }, undefined);
	}
	matchesKeyword(q: string): boolean {
		const k = q.toLowerCase();
		const { title, summary, tags } = this.props;
		return title.toLowerCase().includes(k) || summary.toLowerCase().includes(k) || tags.some((t) => t.toLowerCase().includes(k));
	}
	hasTag(tag: string): boolean {
		return this.props.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
	}
	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
