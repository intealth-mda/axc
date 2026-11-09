import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { requiredText, WorkflowError } from '../errors.ts';
import { EnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';
export interface StatusHistoryEntry {
	readonly fromStatus: string | null;
	readonly toStatus: string;
	readonly changedAt: string;
	readonly changedBy: string;
	readonly reason: string | null;
}
export interface EnrollmentRequestProps extends DomainEntityProps {
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}
export interface EnrollmentRequestEntityReference extends Readonly<Omit<EnrollmentRequestProps, 'statusHistory'>> {
	readonly statusHistory: readonly StatusHistoryEntry[];
}
export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> implements EnrollmentRequestEntityReference {
	static getNewInstance(props: EnrollmentRequestProps, courseId: string, learnerEmail: string, justification: string, now: string): EnrollmentRequest {
		const values = { courseId: requiredText(courseId, 'courseId'), learnerEmail: new LearnerEmail(learnerEmail).value, justification: new Justification(justification).value };
		Object.assign(props, values, { status: 'pending', createdAt: now, updatedAt: now, statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }] });
		return new EnrollmentRequest(props, undefined);
	}
	changeStatus(status: string, changedBy: string, reason: string | undefined, now: string): void {
		const next = new EnrollmentStatus(status).value;
		const actor = requiredText(changedBy, 'changedBy');
		const explanation = reason === undefined ? null : requiredText(reason, 'reason');
		if (next === 'rejected' && !explanation) throw new WorkflowError('INVALID_REQUEST', 'Rejection requires a reason.', 'reason');
		const valid = this.status === 'pending' ? ['approved', 'rejected', 'cancelled'] : this.status === 'approved' ? ['cancelled'] : [];
		if (!valid.includes(next)) throw new WorkflowError('INVALID_STATUS_TRANSITION', `Cannot transition from ${this.status} to ${next}.`, 'status');
		const entry = { fromStatus: this.status, toStatus: next, changedAt: now, changedBy: actor, reason: explanation };
		this.props.status = next;
		this.props.updatedAt = now;
		this.props.statusHistory = [...this.props.statusHistory, entry];
	}
	get courseId(): string {
		return this.props.courseId;
	}
	get learnerEmail(): string {
		return this.props.learnerEmail;
	}
	get justification(): string {
		return this.props.justification;
	}
	get status(): string {
		return this.props.status;
	}
	get createdAt(): string {
		return this.props.createdAt;
	}
	get updatedAt(): string {
		return this.props.updatedAt;
	}
	get statusHistory(): readonly StatusHistoryEntry[] {
		return this.props.statusHistory.map((entry) => ({ ...entry }));
	}
}
