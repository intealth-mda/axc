import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { AllowedTransitions, type EnrollmentStatus, EnrollmentStatuses, EnrollmentValidationError, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

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

export type EnrollmentRequestEntityReference = Readonly<Omit<EnrollmentRequestProps, 'statusHistory'>> & { readonly statusHistory: readonly StatusHistoryEntry[] };

export interface NewEnrollmentRequest {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
}

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	static getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest {
		const learnerEmail = new LearnerEmail(input.learnerEmail).value;
		const justification = new Justification(input.justification).value;
		return new EnrollmentRequest(
			{
				id,
				courseId: input.courseId,
				learnerEmail,
				justification,
				status: EnrollmentStatuses.Pending,
				createdAt: now,
				updatedAt: now,
				statusHistory: [{ fromStatus: null, toStatus: EnrollmentStatuses.Pending, changedAt: now, changedBy: 'system', reason: null }],
			},
			undefined,
		);
	}

	get isActive(): boolean {
		return this.props.status === EnrollmentStatuses.Pending || this.props.status === EnrollmentStatuses.Approved;
	}

	changeStatus(toStatus: EnrollmentStatus, changedBy: string, reason: string | null, now: string): void {
		if (changedBy.trim() === '') throw new EnrollmentValidationError('changedBy', 'changedBy is required.');
		if (toStatus === EnrollmentStatuses.Rejected && (reason ?? '').trim() === '') throw new EnrollmentValidationError('reason', 'reason is required when rejecting.');
		const fromStatus = this.props.status;
		if (!AllowedTransitions[fromStatus].includes(toStatus)) throw new InvalidStatusTransitionError(fromStatus, toStatus);
		this.props.status = toStatus;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus, toStatus, changedAt: now, changedBy, reason });
	}

	toReference(): EnrollmentRequestEntityReference {
		return { ...this.props, statusHistory: this.props.statusHistory.map((e) => ({ ...e })) };
	}
}
