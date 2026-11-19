import { DomainEntity, type DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';

export const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
export const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;

export type CourseModality = (typeof COURSE_MODALITIES)[number];
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export interface CourseProps extends DomainEntityProps {
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

class CourseInvariantError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CourseInvariantError';
	}
}

export class Course extends DomainEntity<CourseProps> {
	private constructor(props: CourseProps) {
		super(props);
	}

	static create(props: CourseProps): Course {
		return new Course(validateCourseProps(props));
	}

	get title(): string {
		return this.props.title;
	}

	get summary(): string {
		return this.props.summary;
	}

	get modality(): CourseModality {
		return this.props.modality;
	}

	get status(): CourseStatus {
		return this.props.status;
	}

	get tags(): readonly string[] {
		return this.props.tags;
	}

	get createdAt(): string {
		return this.props.createdAt;
	}

	get updatedAt(): string {
		return this.props.updatedAt;
	}
}

function validateCourseProps(props: CourseProps): CourseProps {
	const id = requiredText(props.id, 'id');
	const title = requiredText(props.title, 'title');
	const summary = requiredText(props.summary, 'summary');
	if (!isMember(COURSE_MODALITIES, props.modality)) {
		throw new CourseInvariantError('modality is not a course modality');
	}
	if (!isMember(COURSE_STATUSES, props.status)) {
		throw new CourseInvariantError('status is not a course status');
	}
	if (!Array.isArray(props.tags)) {
		throw new CourseInvariantError('tags must be an array of strings');
	}
	const tags = props.tags.map((tag, index) => requiredText(tag, `tags[${index}]`));
	assertTimestamp(props.createdAt, 'createdAt');
	assertTimestamp(props.updatedAt, 'updatedAt');
	return {
		id,
		title,
		summary,
		modality: props.modality,
		status: props.status,
		tags: Object.freeze(tags),
		createdAt: props.createdAt,
		updatedAt: props.updatedAt,
	};
}

function requiredText(value: string, field: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new CourseInvariantError(`${field} must be a non-empty string`);
	}
	return value;
}

function assertTimestamp(value: string, field: string): void {
	if (typeof value !== 'string' || !ISO_UTC_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value))) {
		throw new CourseInvariantError(`${field} must be an ISO-8601 UTC timestamp`);
	}
}

function isMember<T extends string>(values: readonly T[], value: string): value is T {
	return values.some((candidate) => candidate === value);
}
