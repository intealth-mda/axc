import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const CourseModalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);

export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);

export class InvalidCourseError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidCourseError';
		this.field = field;
	}
}

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim().length === 0) throw new InvalidCourseError('title', 'title must not be empty.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
