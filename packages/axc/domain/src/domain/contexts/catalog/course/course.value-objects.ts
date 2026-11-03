import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const Modalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type Modality = (typeof Modalities)[keyof typeof Modalities];

export const Statuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type Status = (typeof Statuses)[keyof typeof Statuses];

const isOneOf = <T extends string>(values: Record<string, T>, value: string): value is T => (Object.values(values) as string[]).includes(value);

export class CourseModality extends ValueObject<{ value: Modality }> {
	constructor(value: string) {
		if (!isOneOf(Modalities, value)) throw new Error(`modality must be one of: ${Object.values(Modalities).join(', ')}.`);
		super({ value });
	}
	get value(): Modality {
		return this.props.value;
	}
	static isValid(value: string): value is Modality {
		return isOneOf(Modalities, value);
	}
}

export class CourseStatus extends ValueObject<{ value: Status }> {
	constructor(value: string) {
		if (!isOneOf(Statuses, value)) throw new Error(`status must be one of: ${Object.values(Statuses).join(', ')}.`);
		super({ value });
	}
	get value(): Status {
		return this.props.value;
	}
	static isValid(value: string): value is Status {
		return isOneOf(Statuses, value);
	}
}
