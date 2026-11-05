import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { CourseModality, CourseStatus } from './course.value-objects.ts';

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

export class Course extends AggregateRoot<CourseProps, undefined> {
	constructor(props: CourseProps) {
		super(props, undefined);
	}

	get isActive(): boolean {
		return this.props.status === 'active';
	}

	hasTag(tag: string): boolean {
		const wanted = tag.toLowerCase();
		return this.props.tags.some((t) => t.toLowerCase() === wanted);
	}

	matchesKeyword(q: string): boolean {
		const needle = q.toLowerCase();
		return [this.props.title, this.props.summary, ...this.props.tags].some((text) => text.toLowerCase().includes(needle));
	}
}
