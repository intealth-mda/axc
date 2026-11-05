import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const Modalities = { online: 'online', inPerson: 'in-person', hybrid: 'hybrid' } as const;
export type Modality = (typeof Modalities)[keyof typeof Modalities];
export const Statuses = { draft: 'draft', active: 'active', retired: 'retired' } as const;
export type Status = (typeof Statuses)[keyof typeof Statuses];

export class InvalidCourseValueError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidCourseValueError';
		this.field = field;
	}
}

export class CourseModality extends ValueObject<{ value: Modality }> {
	constructor(value: string) {
		if (!(Object.values(Modalities) as string[]).includes(value)) {
			throw new InvalidCourseValueError('modality', `modality must be one of ${Object.values(Modalities).join(', ')}.`);
		}
		super({ value: value as Modality });
	}
	get value(): Modality {
		return this.props.value;
	}
}

export class CourseStatus extends ValueObject<{ value: Status }> {
	constructor(value: string) {
		if (!(Object.values(Statuses) as string[]).includes(value)) {
			throw new InvalidCourseValueError('status', `status must be one of ${Object.values(Statuses).join(', ')}.`);
		}
		super({ value: value as Status });
	}
	get value(): Status {
		return this.props.value;
	}
}
