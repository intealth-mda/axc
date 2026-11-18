import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const Modalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type Modality = (typeof Modalities)[keyof typeof Modalities];
export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export class InvalidCourseValueError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidCourseValueError';
		this.field = field;
	}
}

export const isModality = (v: string): v is Modality => (Object.values(Modalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim() === '') throw new InvalidCourseValueError('title', 'title must not be empty.');
		super({ value: value.trim() });
	}
	get value(): string {
		return this.props.value;
	}
}

export class CourseTags extends ValueObject<{ value: readonly string[] }> {
	constructor(value: readonly string[]) {
		if (value.some((t) => t.trim() === '')) throw new InvalidCourseValueError('tags', 'tags must not be empty strings.');
		super({ value: [...new Set(value.map((t) => t.trim().toLowerCase()))] });
	}
	get value(): readonly string[] {
		return this.props.value;
	}
}
