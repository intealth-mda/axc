import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { AllowedTransitions, type EnrollmentStatus, InvalidEnrollmentFieldError, InvalidStatusTransitionError, Justification, LearnerEmail, type StatusHistoryEntry } from './enrollment-request.value-objects.ts';

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

export interface NewEnrollmentRequestInput {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static getNewInstance(id: string, input: NewEnrollmentRequestInput, now: string): EnrollmentRequest {
		const learnerEmail = new LearnerEmail(input.learnerEmail).value;
		const justification = new Justification(input.justification).value;
		return new EnrollmentRequest(
			{
				id,
				courseId: input.courseId,
				learnerEmail,
				justification,
				status: 'pending',
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}

	changeStatus(to: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		const from = this.props.status;
		if (!AllowedTransitions[from].includes(to)) throw new InvalidStatusTransitionError(from, to);
		if (changedBy.trim() === '') throw new InvalidEnrollmentFieldError('changedBy', 'changedBy must not be empty.');
		if (to === 'rejected' && (reason === undefined || reason.trim() === '')) throw new InvalidEnrollmentFieldError('reason', 'reason is required when rejecting.');
		this.props.status = to;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: to, changedAt: now, changedBy, reason: reason ?? null });
	}

	toReference(): EnrollmentRequestEntityReference {
		return { ...this.props, statusHistory: [...this.props.statusHistory] };
	}
}
