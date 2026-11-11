import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const EnrollmentStatuses = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatuses)[keyof typeof EnrollmentStatuses];
export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatuses) as string[]).includes(v);

export const AllowedTransitions: Readonly<Record<EnrollmentStatus, readonly EnrollmentStatus[]>> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export class EnrollmentValidationError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'EnrollmentValidationError';
		this.field = field;
	}
}

export class InvalidStatusTransitionError extends Error {
	constructor(from: EnrollmentStatus, to: EnrollmentStatus) {
		super(`Cannot change status from ${from} to ${to}.`);
		this.name = 'InvalidStatusTransitionError';
	}
}

abstract class StringValue extends ValueObject<{ value: string }> {
	get value(): string {
		return this.props.value;
	}
}

export class LearnerEmail extends StringValue {
	constructor(value: string) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new EnrollmentValidationError('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value });
	}
}

export class Justification extends StringValue {
	constructor(value: string) {
		if (value.trim().length < 20 || value.length > 500) throw new EnrollmentValidationError('justification', 'justification must be between 20 and 500 characters.');
		super({ value });
	}
}
