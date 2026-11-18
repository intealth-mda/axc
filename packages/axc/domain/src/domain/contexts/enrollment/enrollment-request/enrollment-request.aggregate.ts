import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { AllowedTransitions, type EnrollmentStatus, InvalidEnrollmentValueError, InvalidStatusTransitionError, type Justification, type LearnerEmail } from './enrollment-request.value-objects.ts';

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
	statusHistory: StatusHistoryEntry[];
}

export type EnrollmentRequestEntityReference = Readonly<EnrollmentRequestProps>;

export interface NewEnrollmentRequest {
	readonly courseId: string;
	readonly learnerEmail: LearnerEmail;
	readonly justification: Justification;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static create(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return new EnrollmentRequest(
			{
				id,
				courseId: input.courseId,
				learnerEmail: input.learnerEmail.value,
				justification: input.justification.value,
				status: 'pending',
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}

	get isActive(): boolean {
		return this.props.status === 'pending' || this.props.status === 'approved';
	}

	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		const from = this.props.status;
		if (!AllowedTransitions[from].includes(to)) throw new InvalidStatusTransitionError(from, to);
		if (!changedBy.trim()) throw new InvalidEnrollmentValueError('changedBy', 'changedBy must be a non-empty string.');
		const r = reason?.trim() ? reason : null;
		if (to === 'rejected' && r === null) throw new InvalidEnrollmentValueError('reason', 'reason is required when rejecting a request.');
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: to, changedAt: now, changedBy, reason: r });
	}
}
