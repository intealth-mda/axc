import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { EnrollmentStatus, InvalidEnrollmentValueError, type Justification, type LearnerEmail } from './enrollment-request.value-objects.ts';

export interface StatusHistoryEntry {
	readonly fromStatus: EnrollmentStatus | null;
	readonly toStatus: EnrollmentStatus;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}

export interface EnrollmentRequestProps extends DomainEntityProps {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
	status: EnrollmentStatus;
	readonly createdAt: string;
	updatedAt: string;
	readonly statusHistory: StatusHistoryEntry[];
}
export type EnrollmentRequestEntityReference = Readonly<EnrollmentRequestProps>;

export class InvalidStatusTransitionError extends Error {}

const transitions: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
	pending: ['approved', 'rejected', 'cancelled'],
	approved: ['cancelled'],
	rejected: [],
	cancelled: [],
};

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static getNewInstance(id: string, courseId: string, learnerEmail: LearnerEmail, justification: Justification, now: string): EnrollmentRequest {
		return new EnrollmentRequest(
			{
				id,
				courseId,
				learnerEmail: learnerEmail.value,
				justification: justification.value,
				status: EnrollmentStatus.Pending,
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: EnrollmentStatus.Pending, changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}
	get isActive(): boolean {
		return this.props.status === EnrollmentStatus.Pending || this.props.status === EnrollmentStatus.Approved;
	}
	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | null, now: string): void {
		if (to === EnrollmentStatus.Rejected && !reason?.trim()) throw new InvalidEnrollmentValueError('reason', 'reason is required when rejecting.');
		const from = this.props.status;
		if (!transitions[from].includes(to)) throw new InvalidStatusTransitionError(`Cannot change status from ${from} to ${to}.`);
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: to, changedAt: now, changedBy, reason });
	}
	toJSON(): EnrollmentRequestEntityReference {
		return { ...this.props, statusHistory: [...this.props.statusHistory] };
	}
}
