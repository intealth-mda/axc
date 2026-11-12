import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const Modalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type Modality = (typeof Modalities)[keyof typeof Modalities];
export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export const isModality = (v: string): v is Modality => (Object.values(Modalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);

export class InvalidCourseValueError extends Error {
	override name = 'InvalidCourseValueError';
}

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim() === '') throw new InvalidCourseValueError('title must not be empty');
		super({ value: value.trim() });
	}
	get value(): string {
		return this.props.value;
	}
}
