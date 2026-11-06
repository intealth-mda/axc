import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { invalid, RuleError, text } from '../../../errors.ts';
import type { CourseEntityReference } from '../course/index.ts';
import { Justification, LearnerEmail, RequestStatus } from './enrollment-request.value-objects.ts';
export type EnrollmentStatus = RequestStatus['value'];
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
export interface EnrollmentRequestEntityReference extends Readonly<Omit<EnrollmentRequestProps, 'statusHistory'>> {
	readonly statusHistory: readonly StatusHistoryEntry[];
}
export class EnrollmentRequest extends AggregateRoot<EnrollmentRequestProps, undefined> implements EnrollmentRequestEntityReference {
	static getNewInstance(props: EnrollmentRequestProps, course: CourseEntityReference, email: unknown, justification: unknown, now = new Date().toISOString()): EnrollmentRequest {
		if (course.status !== 'active') throw new RuleError('COURSE_NOT_ACTIVE', 'Course is not active.');
		const learnerEmail = new LearnerEmail(email).value;
		const explanation = new Justification(justification).value;
		text(props.id, 'id');
		text(course.id, 'courseId');
		Object.assign(props, {
			courseId: course.id,
			learnerEmail,
			justification: explanation,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }],
		});
		return new EnrollmentRequest(props, undefined);
	}
	changeStatus(status: unknown, changedBy: unknown, reason?: unknown, now = new Date().toISOString()): void {
		const next = new RequestStatus(status).value;
		const actor = text(changedBy, 'changedBy');
		if (reason !== undefined && typeof reason !== 'string') invalid('reason', 'reason must be a string.');
		const explanation = typeof reason === 'string' ? reason.trim() : null;
		if (next === 'rejected' && !explanation) invalid('reason', 'Rejection requires a non-empty reason.');
		if (!(this.status === 'pending' && ['approved', 'rejected', 'cancelled'].includes(next)) && !(this.status === 'approved' && next === 'cancelled')) throw new RuleError('INVALID_STATUS_TRANSITION', 'Invalid status transition.');
		const previous = this.status;
		this.props.statusHistory = [...this.props.statusHistory, { fromStatus: previous, toStatus: next, changedAt: now, changedBy: actor, reason: explanation }];
		this.props.status = next;
		this.props.updatedAt = now;
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
		return structuredClone(this.props.statusHistory);
	}
}
