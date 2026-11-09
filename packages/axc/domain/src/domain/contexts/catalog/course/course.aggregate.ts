import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModalityValue, type CourseStatusValue, CourseTitle } from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModalityValue;
	readonly status: CourseStatusValue;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export type CourseInput = Omit<CourseProps, 'id' | 'createdAt' | 'updatedAt'>;
export type CourseEntityReference = Readonly<CourseProps>;

export class Course extends AggregateRoot<CourseProps, undefined> {
	static getNewInstance(id: string, input: CourseInput, now: string): Course {
		return new Course({ ...input, id, title: new CourseTitle(input.title).value, createdAt: now, updatedAt: now }, undefined);
	}

	matchesKeyword(q: string): boolean {
		const k = q.toLowerCase();
		return [this.props.title, this.props.summary, ...this.props.tags].some((s) => s.toLowerCase().includes(k));
	}

	hasTag(tag: string): boolean {
		const t = tag.toLowerCase();
		return this.props.tags.some((s) => s.toLowerCase() === t);
	}

	toReference(): CourseEntityReference {
		return { ...this.props, tags: [...this.props.tags] };
	}
}
