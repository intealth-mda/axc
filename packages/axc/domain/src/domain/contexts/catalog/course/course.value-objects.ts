import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const CourseModalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const isCourseModality = (value: string): value is CourseModality => (Object.values(CourseModalities) as string[]).includes(value);

export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];
export const isCourseStatus = (value: string): value is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(value);

export class InvalidCourseTitleError extends Error {}

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim() === '') throw new InvalidCourseTitleError('title must not be empty');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
