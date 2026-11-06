import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { EnrollmentStatus, EnrollmentValidationError, InvalidStatusTransitionError, type Justification, type LearnerEmail, STATUS_TRANSITIONS } from './enrollment-request.value-objects.ts';

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

export interface NewEnrollmentRequest {
	readonly courseId: string;
	readonly learnerEmail: LearnerEmail;
	readonly justification: Justification;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return new EnrollmentRequest(
			{
				id,
				courseId: input.courseId,
				learnerEmail: input.learnerEmail.value,
				justification: input.justification.value,
				status: EnrollmentStatus.Pending,
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: EnrollmentStatus.Pending, changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}

	/** pending or approved: blocks a duplicate request for the same learner and course. */
	get isActive(): boolean {
		return this.props.status === EnrollmentStatus.Pending || this.props.status === EnrollmentStatus.Approved;
	}

	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		const from = this.props.status;
		if (!STATUS_TRANSITIONS[from].includes(to)) {
			throw new InvalidStatusTransitionError(from, to);
		}
		const trimmed = reason?.trim() ?? '';
		if (to === EnrollmentStatus.Rejected && trimmed === '') {
			throw new EnrollmentValidationError('reason', 'reason is required when rejecting a request.');
		}
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: to, changedAt: now, changedBy, reason: trimmed === '' ? null : trimmed });
	}
}
