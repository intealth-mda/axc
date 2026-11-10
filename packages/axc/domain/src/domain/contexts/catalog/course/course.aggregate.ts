import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseStatus, type Modality, CourseStatus as Statuses } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: Modality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static create(props: CourseProps): Course {
		return new Course(props, undefined);
	}

	get isActive(): boolean {
		return this.props.status === Statuses.Active;
	}

	matchesKeyword(q: string): boolean {
		const k = q.toLowerCase();
		const { title, summary, tags } = this.props;
		return [title, summary, ...tags].some((s) => s.toLowerCase().includes(k));
	}

	hasTag(tag: string): boolean {
		return this.props.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
	}
}
