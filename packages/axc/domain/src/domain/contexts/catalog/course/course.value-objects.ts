import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const CourseModalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModalityValue = (typeof CourseModalities)[keyof typeof CourseModalities];
export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatusValue = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export class InvalidCourseValueError extends Error {
	override name = 'InvalidCourseValueError';
}

export const isCourseModality = (v: string): v is CourseModalityValue => (Object.values(CourseModalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatusValue => (Object.values(CourseStatuses) as string[]).includes(v);

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim() === '') throw new InvalidCourseValueError('title must not be empty');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
