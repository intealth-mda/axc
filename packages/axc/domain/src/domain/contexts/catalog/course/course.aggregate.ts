import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseStatus, CourseTitle } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(props: CourseProps): Course {
		return new Course({ ...props, title: new CourseTitle(props.title).value }, undefined);
	}

	hasTag(tag: string): boolean {
		const wanted = tag.toLowerCase();
		return this.props.tags.some((t) => t.toLowerCase() === wanted);
	}

	matchesKeyword(keyword: string): boolean {
		const k = keyword.toLowerCase();
		return [this.props.title, this.props.summary, ...this.props.tags].some((text) => text.toLowerCase().includes(k));
	}
}
