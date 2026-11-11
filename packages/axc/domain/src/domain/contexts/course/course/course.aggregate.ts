import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type CourseModality, type CourseSortField, type CourseStatus, CourseStatuses } from './course.value-objects.ts';

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

export interface CourseSearchCriteria {
	readonly q?: string | undefined;
	readonly modality?: CourseModality | undefined;
	readonly status?: CourseStatus | undefined;
	readonly tag?: string | undefined;
}

export class Course extends AggregateRoot<CourseProps, undefined> {
	get isActive(): boolean {
		return this.props.status === CourseStatuses.Active;
	}

	matches({ q, modality, status, tag }: CourseSearchCriteria): boolean {
		const p = this.props;
		const tags = p.tags.map((t) => t.toLowerCase());
		const needle = q?.toLowerCase();
		return (
			(needle === undefined || p.title.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle) || tags.some((t) => t.includes(needle))) &&
			(modality === undefined || p.modality === modality) &&
			(status === undefined || p.status === status) &&
			(tag === undefined || tags.includes(tag.toLowerCase()))
		);
	}

	static compare(sort: CourseSortField) {
		return (a: Course, b: Course): number => a.props[sort].localeCompare(b.props[sort]);
	}
}
