import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { CourseModality, CourseStatus } from './course.value-objects.ts';

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
	static create(props: CourseProps): Course {
		if (!props.title.trim()) throw new Error('title is required');
		return new Course({ ...props, tags: [...props.tags] }, undefined);
	}

	matches(keyword: string): boolean {
		const k = keyword.toLowerCase();
		return [this.props.title, this.props.summary, ...this.props.tags].some((s) => s.toLowerCase().includes(k));
	}

	hasTag(tag: string): boolean {
		const t = tag.toLowerCase();
		return this.props.tags.some((x) => x.toLowerCase() === t);
	}

	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
