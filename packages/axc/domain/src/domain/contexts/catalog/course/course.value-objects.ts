import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const Modalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type Modality = (typeof Modalities)[keyof typeof Modalities];
export const Statuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type Status = (typeof Statuses)[keyof typeof Statuses];

export const isModality = (v: string): v is Modality => (Object.values(Modalities) as string[]).includes(v);
export const isStatus = (v: string): v is Status => (Object.values(Statuses) as string[]).includes(v);

export class InvalidCourseValueError extends Error {}

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim() === '') throw new InvalidCourseValueError('title is required');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
