import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { type EnrollmentStatus, Justification, LearnerEmail, Status } from './enrollment-request.value-objects.ts';
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
export interface EnrollmentRequestEntityReference extends Readonly<Omit<EnrollmentRequestProps, 'statusHistory'>> {
	readonly statusHistory: ReadonlyArray<Readonly<StatusHistoryEntry>>;
}
export class InvalidStatusTransition extends Error {
	constructor() {
		super('Invalid status transition');
	}
}
export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> implements EnrollmentRequestEntityReference {
	static getNewInstance(props: Omit<EnrollmentRequestProps, 'status' | 'statusHistory' | 'updatedAt'>): EnrollmentRequest {
		const learnerEmail = new LearnerEmail(props.learnerEmail).valueOf();
		const justification = new Justification(props.justification).valueOf();
		if (!props.courseId.trim()) throw new Error('Invalid course ID');
		return new EnrollmentRequest(
			{ ...props, learnerEmail, justification, status: 'pending', updatedAt: props.createdAt, statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: props.createdAt, changedBy: 'system', reason: null }] },
			undefined,
		);
	}
	static rehydrate(props: EnrollmentRequestProps): EnrollmentRequest {
		return new EnrollmentRequest({ ...props, status: new Status(props.status).valueOf(), statusHistory: props.statusHistory.map((x) => ({ ...x })) }, undefined);
	}
	transition(status: EnrollmentStatus, changedBy: string, reason: string | null, changedAt: string): void {
		const target = new Status(status).valueOf();
		const allowed: Record<EnrollmentStatus, EnrollmentStatus[]> = { pending: ['approved', 'rejected', 'cancelled'], approved: ['cancelled'], rejected: [], cancelled: [] };
		if (!allowed[this.props.status].includes(target)) throw new InvalidStatusTransition();
		if (target === 'rejected' && !reason?.trim()) throw new Error('Rejection requires a reason');
		if (!changedBy.trim()) throw new Error('changedBy is required');
		const fromStatus = this.props.status;
		this.props.status = target;
		this.props.updatedAt = changedAt;
		this.props.statusHistory.push({ fromStatus, toStatus: target, changedAt, changedBy: changedBy.trim(), reason: reason?.trim() || null });
	}
	get courseId() {
		return this.props.courseId;
	}
	get learnerEmail() {
		return this.props.learnerEmail;
	}
	get justification() {
		return this.props.justification;
	}
	get status() {
		return this.props.status;
	}
	get createdAt() {
		return this.props.createdAt;
	}
	get updatedAt() {
		return this.props.updatedAt;
	}
	get statusHistory() {
		return this.props.statusHistory.map((x) => ({ ...x }));
	}
	toReference(): EnrollmentRequestEntityReference {
		return { id: this.id, courseId: this.courseId, learnerEmail: this.learnerEmail, justification: this.justification, status: this.status, createdAt: this.createdAt, updatedAt: this.updatedAt, statusHistory: this.statusHistory };
	}
}
