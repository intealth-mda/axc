import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { canTransition, type EnrollmentStatus, EnrollmentValidationError, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

export interface StatusHistoryEntry {
	readonly fromStatus: EnrollmentStatus | null;
	readonly toStatus: EnrollmentStatus;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}
export interface EnrollmentRequestProps extends DomainEntityProps {
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: EnrollmentStatus;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}
export type EnrollmentRequestEntityReference = Readonly<EnrollmentRequestProps>;
export interface NewEnrollmentRequest {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static create(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		return new EnrollmentRequest(
			{
				id,
				courseId: input.courseId,
				learnerEmail: new LearnerEmail(input.learnerEmail).value,
				justification: new Justification(input.justification).value,
				status: 'pending',
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}
	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		if (to === 'rejected' && !reason?.trim()) throw new EnrollmentValidationError('reason', 'reason is required when rejecting.');
		if (!canTransition(this.props.status, to)) throw new InvalidStatusTransitionError(`Cannot change status from ${this.props.status} to ${to}.`);
		this.props.statusHistory.push({ fromStatus: this.props.status, toStatus: to, changedAt: now, changedBy, reason: reason ?? null });
		this.props.status = to;
		this.props.updatedAt = now;
	}
	toReference(): EnrollmentRequestEntityReference {
		return { ...this.props, statusHistory: [...this.props.statusHistory] };
	}
}
