import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Modality, Status } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: Modality;
	readonly status: Status;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export type CourseEntityReference = Readonly<CourseProps>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(id: string, input: Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>, now: string): Course {
		return new Course({ ...input, id, createdAt: now, updatedAt: now }, undefined);
	}

	get reference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}

	matchesKeyword(q: string): boolean {
		const k = q.toLowerCase();
		const { title, summary, tags } = this.props;
		return [title, summary, ...tags].some((s) => s.toLowerCase().includes(k));
	}

	hasTag(tag: string): boolean {
		const t = tag.toLowerCase();
		return this.props.tags.some((x) => x.toLowerCase() === t);
	}
}
