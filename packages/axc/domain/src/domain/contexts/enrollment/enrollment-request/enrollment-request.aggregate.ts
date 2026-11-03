import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { canTransition, type EnrollmentStatus, EnrollmentStatuses, EnrollmentStatusValue, InvalidStatusTransitionError, Justification, LearnerEmail, NonEmptyText } from './enrollment-request.value-objects.ts';

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

export interface NewEnrollmentRequestInput {
	courseId: string;
	learnerEmail: unknown;
	justification: unknown;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, unknown> {
	static getNewInstance(id: string, input: NewEnrollmentRequestInput, now: string): EnrollmentRequest {
		const learnerEmail = new LearnerEmail(input.learnerEmail).value;
		const justification = new Justification(input.justification).value;
		return new EnrollmentRequest(
			{
				id,
				courseId: input.courseId,
				learnerEmail,
				justification,
				status: EnrollmentStatuses.pending,
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: EnrollmentStatuses.pending, changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}

	/** pending and approved requests block a duplicate for the same learner and course. */
	get isActive(): boolean {
		return this.props.status === EnrollmentStatuses.pending || this.props.status === EnrollmentStatuses.approved;
	}

	changeStatus(status: unknown, changedBy: unknown, reason: unknown, now: string): void {
		const to = new EnrollmentStatusValue(status).value;
		const by = new NonEmptyText('changedBy', changedBy).value;
		const why = to === EnrollmentStatuses.rejected ? new NonEmptyText('reason', reason).value : typeof reason === 'string' && reason.trim() !== '' ? reason.trim() : null;
		const from = this.props.status;
		if (!canTransition(from, to)) {
			throw new InvalidStatusTransitionError(from, to);
		}
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: to, changedAt: now, changedBy: by, reason: why });
	}
}
