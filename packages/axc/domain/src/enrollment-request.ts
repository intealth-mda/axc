import { DomainEntity, type DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';

export const ENROLLMENT_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export const ENROLLMENT_REQUEST_CREATED_BY = 'system' as const;
export const JUSTIFICATION_MIN_LENGTH = 20;
export const JUSTIFICATION_MAX_LENGTH = 500;

export type EnrollmentRequestStatus = (typeof ENROLLMENT_REQUEST_STATUSES)[number];

export interface StatusHistoryEntry {
	readonly fromStatus: EnrollmentRequestStatus | null;
	readonly toStatus: EnrollmentRequestStatus;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}

export interface EnrollmentRequestProps extends DomainEntityProps {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
	readonly status: EnrollmentRequestStatus;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly statusHistory: readonly StatusHistoryEntry[];
}

export interface OpenEnrollmentRequest {
	readonly id: string;
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
	readonly createdAt: string;
}

export interface EnrollmentStatusChange {
	readonly toStatus: EnrollmentRequestStatus;
	readonly changedBy: string;
	readonly changedAt: string;
	readonly reason: string | null;
}

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const LEARNER_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EnrollmentRequestInvariantError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'EnrollmentRequestInvariantError';
	}
}

export class EnrollmentStatusTransitionError extends Error {
	readonly fromStatus: EnrollmentRequestStatus;
	readonly toStatus: EnrollmentRequestStatus;

	constructor(fromStatus: EnrollmentRequestStatus, toStatus: EnrollmentRequestStatus) {
		super(`${fromStatus} cannot change to ${toStatus}`);
		this.name = 'EnrollmentStatusTransitionError';
		this.fromStatus = fromStatus;
		this.toStatus = toStatus;
	}
}

export class EnrollmentRequest extends DomainEntity<EnrollmentRequestProps> {
	private constructor(props: EnrollmentRequestProps) {
		super(props);
	}

	static open(input: OpenEnrollmentRequest): EnrollmentRequest {
		const createdAt = assertTimestamp(input.createdAt, 'createdAt');
		const request: EnrollmentRequestProps = {
			id: requiredText(input.id, 'id'),
			courseId: requiredText(input.courseId, 'courseId'),
			learnerEmail: assertLearnerEmail(input.learnerEmail),
			justification: assertJustification(input.justification),
			status: 'pending',
			createdAt,
			updatedAt: createdAt,
			statusHistory: Object.freeze([
				{
					fromStatus: null,
					toStatus: 'pending' as const,
					changedAt: createdAt,
					changedBy: ENROLLMENT_REQUEST_CREATED_BY,
					reason: null,
				},
			]),
		};
		return new EnrollmentRequest(request);
	}

	get courseId(): string {
		return this.props.courseId;
	}

	get learnerEmail(): string {
		return this.props.learnerEmail;
	}

	get justification(): string {
		return this.props.justification;
	}

	get status(): EnrollmentRequestStatus {
		return this.props.status;
	}

	get createdAt(): string {
		return this.props.createdAt;
	}

	get updatedAt(): string {
		return this.props.updatedAt;
	}

	get statusHistory(): readonly StatusHistoryEntry[] {
		return this.props.statusHistory;
	}

	transition(change: EnrollmentStatusChange): EnrollmentRequest {
		if (!canTransition(this.status, change.toStatus)) {
			throw new EnrollmentStatusTransitionError(this.status, change.toStatus);
		}
		const changedAt = assertTimestamp(change.changedAt, 'changedAt');
		const changedBy = requiredText(change.changedBy, 'changedBy');
		const reason = reasonForTransition(change.toStatus, change.reason);
		const entry: StatusHistoryEntry = {
			fromStatus: this.status,
			toStatus: change.toStatus,
			changedAt,
			changedBy,
			reason,
		};
		return new EnrollmentRequest({
			...this.props,
			status: change.toStatus,
			updatedAt: changedAt,
			statusHistory: Object.freeze([...this.statusHistory, entry]),
		});
	}
}

export function isLearnerEmail(value: string): boolean {
	return LEARNER_EMAIL.test(value);
}

export function isJustificationLength(value: string): boolean {
	return value.length >= JUSTIFICATION_MIN_LENGTH && value.length <= JUSTIFICATION_MAX_LENGTH;
}

export function learnerEmailsMatch(left: string, right: string): boolean {
	return left.toLowerCase() === right.toLowerCase();
}

function canTransition(fromStatus: EnrollmentRequestStatus, toStatus: EnrollmentRequestStatus): boolean {
	if (fromStatus === 'pending') {
		return toStatus === 'approved' || toStatus === 'rejected' || toStatus === 'cancelled';
	}
	return fromStatus === 'approved' && toStatus === 'cancelled';
}

function reasonForTransition(toStatus: EnrollmentRequestStatus, reason: string | null): string | null {
	if (toStatus === 'rejected') {
		if (reason === null || reason.trim() === '') {
			throw new EnrollmentRequestInvariantError('reason is required when status is rejected');
		}
		return reason.trim();
	}
	if (reason === null || reason.trim() === '') {
		return null;
	}
	return reason.trim();
}

function assertLearnerEmail(value: string): string {
	const email = requiredText(value, 'learnerEmail').trim();
	if (!isLearnerEmail(email)) {
		throw new EnrollmentRequestInvariantError('learnerEmail must be a valid email address');
	}
	return email;
}

function assertJustification(value: string): string {
	if (typeof value !== 'string' || !isJustificationLength(value)) {
		throw new EnrollmentRequestInvariantError(`justification must be between ${JUSTIFICATION_MIN_LENGTH} and ${JUSTIFICATION_MAX_LENGTH} characters`);
	}
	return value;
}

function requiredText(value: string, field: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new EnrollmentRequestInvariantError(`${field} must be a non-empty string`);
	}
	return value.trim();
}

function assertTimestamp(value: string, field: string): string {
	if (typeof value !== 'string' || !ISO_UTC_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value))) {
		throw new EnrollmentRequestInvariantError(`${field} must be an ISO-8601 UTC timestamp`);
	}
	return value;
}
