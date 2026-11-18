import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { canTransition, type EnrollmentStatus, InvalidEnrollmentValueError, InvalidStatusTransitionError, Justification, LearnerEmail, type StatusHistoryEntry } from './enrollment-request.value-objects.ts';

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
		return new EnrollmentRequest({
			id,
			courseId: input.courseId,
			learnerEmail: new LearnerEmail(input.learnerEmail).value,
			justification: new Justification(input.justification).value,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
		});
	}
	private constructor(props: EnrollmentRequestProps) {
		super(props, undefined);
	}
	get isActive(): boolean {
		return this.props.status === 'pending' || this.props.status === 'approved';
	}
	changeStatus(toStatus: EnrollmentStatus, changedBy: string, reason: string | undefined, now: string): void {
		if (changedBy.trim().length === 0) throw new InvalidEnrollmentValueError('changedBy', 'changedBy must not be empty.');
		if (toStatus === 'rejected' && (reason === undefined || reason.trim().length === 0)) throw new InvalidEnrollmentValueError('reason', 'reason is required for rejection.');
		const fromStatus = this.props.status;
		if (!canTransition(fromStatus, toStatus)) throw new InvalidStatusTransitionError(fromStatus, toStatus);
		this.props.status = toStatus;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus, toStatus, changedAt: now, changedBy, reason: reason ?? null });
	}
	toReference(): EnrollmentRequestEntityReference {
		return { ...this.props, statusHistory: [...this.props.statusHistory] };
	}
}
