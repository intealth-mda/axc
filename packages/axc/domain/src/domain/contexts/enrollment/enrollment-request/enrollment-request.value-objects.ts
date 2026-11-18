import { ValueObject } from '@cellix/domain-seedwork/value-object';

export class InvalidEnrollmentValueError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidEnrollmentValueError';
		this.field = field;
	}
}

export class InvalidStatusTransitionError extends Error {
	constructor(from: string, to: string) {
		super(`Cannot change status from ${from} to ${to}.`);
		this.name = 'InvalidStatusTransitionError';
	}
}

export const EnrollmentStatuses = { pending: 'pending', approved: 'approved', rejected: 'rejected', cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatuses)[keyof typeof EnrollmentStatuses];
export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatuses) as string[]).includes(v);

export const AllowedTransitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (!EMAIL.test(value)) throw new InvalidEnrollmentValueError('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value });
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
