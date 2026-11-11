export const EnrollmentStatuses = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatuses)[keyof typeof EnrollmentStatuses];

export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatuses) as string[]).includes(v);

const Transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};
export const canTransition = (from: EnrollmentStatus, to: EnrollmentStatus): boolean => Transitions[from].includes(to);

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

export class LearnerEmail {
	readonly value: string;
	constructor(value: string) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new InvalidEnrollmentValueError('learnerEmail', 'learnerEmail must be a valid email address.');
		this.value = value;
	}
}

export class Justification {
	readonly value: string;
	constructor(value: string) {
		const len = value.trim().length;
		if (len < 20 || len > 500) throw new InvalidEnrollmentValueError('justification', 'justification must be between 20 and 500 characters.');
		this.value = value;
	}
}

export class NonEmptyText {
	readonly value: string;
	constructor(field: string, value: string) {
		if (value.trim() === '') throw new InvalidEnrollmentValueError(field, `${field} must not be empty.`);
		this.value = value;
	}
}
