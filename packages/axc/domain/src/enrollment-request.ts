import { DomainEntity, type DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';

export const enrollmentRequestStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type EnrollmentRequestStatus = (typeof enrollmentRequestStatuses)[number];

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

export interface EnrollmentStatusChange {
	readonly toStatus: EnrollmentRequestStatus;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}

export type SaveEnrollmentRequestResult = 'inserted' | 'updated' | 'duplicate-active';

/** Process-local store for enrollment requests. */
export interface EnrollmentRequestStore {
	list(): Promise<readonly EnrollmentRequest[]>;
	findById(id: string): Promise<EnrollmentRequest | undefined>;
	save(request: EnrollmentRequest): Promise<SaveEnrollmentRequestResult>;
	nextId(): string;
}

export class InvalidEnrollmentTransitionError extends Error {
	readonly fromStatus: EnrollmentRequestStatus;
	readonly toStatus: EnrollmentRequestStatus;

	constructor(fromStatus: EnrollmentRequestStatus, toStatus: EnrollmentRequestStatus) {
		super(`Cannot transition from ${fromStatus} to ${toStatus}.`);
		this.name = 'InvalidEnrollmentTransitionError';
		this.fromStatus = fromStatus;
		this.toStatus = toStatus;
	}
}

export class EnrollmentRequest extends DomainEntity<EnrollmentRequestProps> {
	static create(input: { readonly id: string; readonly courseId: string; readonly learnerEmail: string; readonly justification: string; readonly createdAt: string }): EnrollmentRequest {
		return new EnrollmentRequest({
			id: input.id,
			courseId: input.courseId,
			learnerEmail: input.learnerEmail,
			justification: input.justification,
			status: 'pending',
			createdAt: input.createdAt,
			updatedAt: input.createdAt,
			statusHistory: [
				{
					fromStatus: null,
					toStatus: 'pending',
					changedAt: input.createdAt,
					changedBy: 'system',
					reason: null,
				},
			],
		});
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

	withStatus(change: EnrollmentStatusChange): EnrollmentRequest {
		if (!isAllowedEnrollmentTransition(this.status, change.toStatus)) {
			throw new InvalidEnrollmentTransitionError(this.status, change.toStatus);
		}
		return new EnrollmentRequest({
			...this.props,
			status: change.toStatus,
			updatedAt: change.changedAt,
			statusHistory: [
				...this.props.statusHistory,
				{
					fromStatus: this.status,
					toStatus: change.toStatus,
					changedAt: change.changedAt,
					changedBy: change.changedBy,
					reason: change.reason,
				},
			],
		});
	}
}

export function isEnrollmentRequestStatus(value: string): value is EnrollmentRequestStatus {
	return enrollmentRequestStatuses.some((status) => status === value);
}

export function isAllowedEnrollmentTransition(fromStatus: EnrollmentRequestStatus, toStatus: EnrollmentRequestStatus): boolean {
	if (fromStatus === 'pending') {
		return toStatus === 'approved' || toStatus === 'rejected' || toStatus === 'cancelled';
	}
	return fromStatus === 'approved' && toStatus === 'cancelled';
}

export function enrollmentEmailsMatch(left: string, right: string): boolean {
	return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

export function isDuplicateActiveEnrollment(existing: EnrollmentRequest, courseId: string, learnerEmail: string): boolean {
	const active = existing.status === 'pending' || existing.status === 'approved';
	return active && existing.courseId === courseId && enrollmentEmailsMatch(existing.learnerEmail, learnerEmail);
}
