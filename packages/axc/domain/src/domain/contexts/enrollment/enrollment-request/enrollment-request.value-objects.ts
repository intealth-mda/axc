import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const EnrollmentStatuses = { pending: 'pending', approved: 'approved', rejected: 'rejected', cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatuses)[keyof typeof EnrollmentStatuses];
export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatuses) as string[]).includes(v);

const transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};
export const canTransition = (from: EnrollmentStatus, to: EnrollmentStatus): boolean => transitions[from].includes(to);

export class InvalidEnrollmentValueError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidEnrollmentValueError';
		this.field = field;
	}
}

export class InvalidStatusTransitionError extends Error {
	constructor(from: EnrollmentStatus, to: EnrollmentStatus) {
		super(`Cannot change status from ${from} to ${to}.`);
		this.name = 'InvalidStatusTransitionError';
	}
}

export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new InvalidEnrollmentValueError('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}

export class Justification extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.length < 20 || value.length > 500) throw new InvalidEnrollmentValueError('justification', 'justification must be between 20 and 500 characters.');
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
