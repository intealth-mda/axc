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

export const ActiveStatuses: readonly EnrollmentStatus[] = ['pending', 'approved'];

export class InvalidEnrollmentFieldError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidEnrollmentFieldError';
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
		if (!EMAIL.test(value)) throw new InvalidEnrollmentFieldError('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}

export class Justification extends ValueObject<{ value: string }> {
	constructor(value: string) {
		const len = value.trim().length;
		if (len < 20 || len > 500) throw new InvalidEnrollmentFieldError('justification', 'justification must be between 20 and 500 characters.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}

export interface StatusHistoryEntry {
	readonly fromStatus: EnrollmentStatus | null;
	readonly toStatus: EnrollmentStatus;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}
