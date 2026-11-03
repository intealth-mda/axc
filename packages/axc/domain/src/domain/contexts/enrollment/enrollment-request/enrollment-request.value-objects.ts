export const EnrollmentStatuses = { pending: 'pending', approved: 'approved', rejected: 'rejected', cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatuses)[keyof typeof EnrollmentStatuses];

const transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export const canTransition = (from: EnrollmentStatus, to: EnrollmentStatus): boolean => transitions[from].includes(to);

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

export class EnrollmentStatusValue {
	readonly value: EnrollmentStatus;
	constructor(value: unknown) {
		if (!Object.values<unknown>(EnrollmentStatuses).includes(value)) {
			throw new EnrollmentValidationError('status', `status must be one of ${Object.values(EnrollmentStatuses).join(', ')}.`);
		}
		this.value = value as EnrollmentStatus;
	}
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LearnerEmail {
	readonly value: string;
	constructor(value: unknown) {
		if (typeof value !== 'string' || !EMAIL.test(value)) {
			throw new EnrollmentValidationError('learnerEmail', 'learnerEmail must be a valid email address.');
		}
		this.value = value;
	}
}

export class Justification {
	readonly value: string;
	constructor(value: unknown) {
		if (typeof value !== 'string' || value.length < 20 || value.length > 500) {
			throw new EnrollmentValidationError('justification', 'justification must be between 20 and 500 characters.');
		}
		this.value = value;
	}
}

export class NonEmptyText {
	readonly value: string;
	constructor(field: string, value: unknown) {
		if (typeof value !== 'string' || value.trim() === '') {
			throw new EnrollmentValidationError(field, `${field} must be a non-empty string.`);
		}
		this.value = value.trim();
	}
}
