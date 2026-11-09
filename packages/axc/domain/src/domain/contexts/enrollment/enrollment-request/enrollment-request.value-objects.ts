export const EnrollmentStatus = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];
export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatus) as string[]).includes(v);

export const ALLOWED_TRANSITIONS: Readonly<Record<EnrollmentStatus, readonly EnrollmentStatus[]>> = {
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

export class LearnerEmail {
	readonly value: string;
	constructor(value: string) {
		if (!EMAIL.test(value)) throw new EnrollmentValidationError('learnerEmail', 'learnerEmail must be a valid email address.');
		this.value = value.toLowerCase();
	}
}

export class Justification {
	readonly value: string;
	constructor(value: string) {
		if (value.length < 20 || value.length > 500) throw new EnrollmentValidationError('justification', 'justification must be between 20 and 500 characters.');
		this.value = value;
	}
}
