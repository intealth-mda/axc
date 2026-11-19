import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const EnrollmentStatus = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];
export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatus) as string[]).includes(v);

export class InvalidEnrollmentValueError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.field = field;
	}
}

export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new InvalidEnrollmentValueError('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value: value.toLowerCase() });
	}
	get value(): string {
		return this.props.value;
	}
}

export class Justification extends ValueObject<{ value: string }> {
	constructor(value: string) {
		const n = value.trim().length;
		if (n < 20 || n > 500) throw new InvalidEnrollmentValueError('justification', 'justification must be between 20 and 500 characters.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
