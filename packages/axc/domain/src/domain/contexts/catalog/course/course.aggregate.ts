import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseStatus, CourseStatuses } from './course.value-objects.ts';

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

export class Course extends AggregateRoot<CourseProps, unknown> {
	static getNewInstance(props: CourseProps): Course {
		return new Course(props, undefined);
	}

	get isActive(): boolean {
		return this.props.status === CourseStatuses.active;
	}

	/** Case-insensitive keyword match over title, summary and tags. */
	matchesKeyword(keyword: string): boolean {
		const k = keyword.toLowerCase();
		return [this.props.title, this.props.summary, ...this.props.tags].some((text) => text.toLowerCase().includes(k));
	}

	hasTag(tag: string): boolean {
		return this.props.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
	}
}
