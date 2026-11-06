import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const EnrollmentStatus = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

const enrollmentStatuses: readonly string[] = Object.values(EnrollmentStatus);
export const isEnrollmentStatus = (value: string): value is EnrollmentStatus => enrollmentStatuses.includes(value);

export const STATUS_TRANSITIONS: Readonly<Record<EnrollmentStatus, readonly EnrollmentStatus[]>> = {
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (!EMAIL.test(value)) {
			throw new EnrollmentValidationError('learnerEmail', 'learnerEmail must be a valid email address.');
		}
		super({ value: value.toLowerCase() });
	}

	get value(): string {
		return this.props.value;
	}
}

export class Justification extends ValueObject<{ value: string }> {
	constructor(value: string) {
		const length = value.trim().length;
		if (length < 20 || length > 500) {
			throw new EnrollmentValidationError('justification', 'justification must be between 20 and 500 characters.');
		}
		super({ value });
	}

	get value(): string {
		return this.props.value;
	}
}
