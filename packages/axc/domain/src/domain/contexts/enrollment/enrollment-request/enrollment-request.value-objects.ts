export const EnrollmentStatus = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const isEnrollmentStatus = (value: unknown): value is EnrollmentStatus => (Object.values(EnrollmentStatus) as unknown[]).includes(value);

const transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export const canTransition = (from: EnrollmentStatus, to: EnrollmentStatus): boolean => transitions[from].includes(to);

export class InvalidEnrollmentInputError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidEnrollmentInputError';
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
	constructor(value: unknown) {
		if (typeof value !== 'string' || !EMAIL.test(value)) {
			throw new InvalidEnrollmentInputError('learnerEmail', 'learnerEmail must be a valid email address.');
		}
		this.value = value.toLowerCase();
	}
}

export class Justification {
	readonly value: string;
	constructor(value: unknown) {
		const text = typeof value === 'string' ? value.trim() : '';
		if (text.length < 20 || text.length > 500) {
			throw new InvalidEnrollmentInputError('justification', 'justification must be between 20 and 500 characters.');
		}
		this.value = text;
	}
}
