import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { canTransition, type EnrollmentStatus, InvalidEnrollmentValueError, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

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
	readonly learnerEmail: string;
	readonly justification: string;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
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

	get courseId(): string {
		return this.props.courseId;
	}
	get learnerEmail(): string {
		return this.props.learnerEmail;
	}
	get status(): EnrollmentStatus {
		return this.props.status;
	}

	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		if (changedBy.trim() === '') throw new InvalidEnrollmentValueError('changedBy', 'changedBy is required.');
		if (to === 'rejected' && (reason ?? '').trim() === '') throw new InvalidEnrollmentValueError('reason', 'reason is required when rejecting a request.');
		const from = this.props.status;
		if (!canTransition(from, to)) throw new InvalidStatusTransitionError(from, to);
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory = [...this.props.statusHistory, { fromStatus: from, toStatus: to, changedAt: now, changedBy, reason: reason ?? null }];
	}

	toReference(): EnrollmentRequestEntityReference {
		return { ...this.props, statusHistory: [...this.props.statusHistory] };
	}
}
