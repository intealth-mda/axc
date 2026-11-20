import { ValueObject } from '@cellix/domain-seedwork/value-object';

export class EnrollmentValidationError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.field = field;
	}
}
export class InvalidStatusTransitionError extends Error {}

export const EnrollmentStatuses = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Cancelled: 'cancelled' } as const;
export type EnrollmentStatus = (typeof EnrollmentStatuses)[keyof typeof EnrollmentStatuses];
export const isEnrollmentStatus = (v: string): v is EnrollmentStatus => (Object.values(EnrollmentStatuses) as string[]).includes(v);
export const ActiveEnrollmentStatuses: readonly EnrollmentStatus[] = ['pending', 'approved'];
const Transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};
export const canTransition = (from: EnrollmentStatus, to: EnrollmentStatus): boolean => Transitions[from].includes(to);

export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new EnrollmentValidationError('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}

export class Justification extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.length < 20 || value.length > 500) throw new EnrollmentValidationError('justification', 'justification must be between 20 and 500 characters.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
