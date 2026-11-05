import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { canTransition, type EnrollmentStatus, InvalidEnrollmentInputError, InvalidStatusTransitionError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

export interface StatusHistoryEntry {
	fromStatus: EnrollmentStatus | null;
	toStatus: EnrollmentStatus;
	changedAt: string;
	changedBy: string;
	reason: string | null;
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

export interface NewEnrollmentRequestInput {
	courseId: unknown;
	learnerEmail: unknown;
	justification: unknown;
}

const requiredText = (field: string, value: unknown): string => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new InvalidEnrollmentInputError(field, `${field} is required.`);
	}
	return value.trim();
};

export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> {
	constructor(props: EnrollmentRequestProps) {
		super(props, undefined);
	}

	static create(id: string, input: NewEnrollmentRequestInput, now: string): EnrollmentRequest {
		const courseId = requiredText('courseId', input.courseId);
		const learnerEmail = new LearnerEmail(input.learnerEmail).value;
		const justification = new Justification(input.justification).value;
		return new EnrollmentRequest({
			id,
			courseId,
			learnerEmail,
			justification,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
		});
	}

	get isActive(): boolean {
		return this.props.status === 'pending' || this.props.status === 'approved';
	}

	changeStatus(status: unknown, changedBy: unknown, reason: unknown, now: string): void {
		if (!isEnrollmentStatus(status)) {
			throw new InvalidEnrollmentInputError('status', 'status must be one of pending, approved, rejected, cancelled.');
		}
		const by = requiredText('changedBy', changedBy);
		const why = typeof reason === 'string' && reason.trim() !== '' ? reason.trim() : null;
		if (status === 'rejected' && why === null) {
			throw new InvalidEnrollmentInputError('reason', 'reason is required when rejecting a request.');
		}
		const from = this.props.status;
		if (!canTransition(from, status)) {
			throw new InvalidStatusTransitionError(from, status);
		}
		this.props.status = status;
		this.props.updatedAt = now;
		this.props.statusHistory.push({ fromStatus: from, toStatus: status, changedAt: now, changedBy: by, reason: why });
	}
}
