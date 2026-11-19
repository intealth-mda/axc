import { VOString } from '@lucaspaganini/value-objects';

export class LearnerEmail extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 319,
}) {}

export class Justification extends VOString({
	trim: true,
	minLength: 20,
	maxLength: 500,
}) {}

export class Status extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 9,
}) {}

export const enrollmentRequestStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;

export type EnrollmentRequestStatus = (typeof enrollmentRequestStatuses)[number];

const activeEnrollmentRequestStatuses = ['pending', 'approved'] as const;

const enrollmentRequestTransitions: Readonly<Record<EnrollmentRequestStatus, readonly EnrollmentRequestStatus[]>> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export function isEnrollmentRequestStatus(value: string): value is EnrollmentRequestStatus {
	return (enrollmentRequestStatuses as readonly string[]).includes(value);
}

export function isActiveEnrollmentRequestStatus(value: string): boolean {
	return (activeEnrollmentRequestStatuses as readonly string[]).includes(value);
}

export function canTransitionEnrollmentRequestStatus(from: string, to: string): boolean {
	if (!isEnrollmentRequestStatus(from) || !isEnrollmentRequestStatus(to)) {
		return false;
	}
	return enrollmentRequestTransitions[from].includes(to);
}
