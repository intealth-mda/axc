import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { canTransition, type EnrollmentStatus, InvalidEnrollmentValueError, InvalidStatusTransitionError, Justification, LearnerEmail, NonEmptyText } from './enrollment-request.value-objects.ts';

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
	readonly learnerEmail: string;
	readonly justification: string;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		const courseId = new NonEmptyText('courseId', input.courseId).value;
		const learnerEmail = new LearnerEmail(input.learnerEmail).value;
		const justification = new Justification(input.justification).value;
		return new EnrollmentRequest(
			{ id, courseId, learnerEmail, justification, status: 'pending', createdAt: now, updatedAt: now, statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }] },
			undefined,
		);
	}

	get isActive(): boolean {
		return this.props.status === 'pending' || this.props.status === 'approved';
	}

	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		const by = new NonEmptyText('changedBy', changedBy).value;
		const from = this.props.status;
		if (!canTransition(from, to)) throw new InvalidStatusTransitionError(from, to);
		if (to === 'rejected' && (reason === undefined || reason.trim() === '')) throw new InvalidEnrollmentValueError('reason', 'reason is required when rejecting a request.');
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: to, changedAt: now, changedBy: by, reason: reason ?? null });
	}
}
