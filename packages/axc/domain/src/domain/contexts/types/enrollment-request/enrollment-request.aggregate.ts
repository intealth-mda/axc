import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Passport } from '../../passport.ts';
import * as ValueObjects from './enrollment-request.value-objects.ts';
import { StatusHistory, type StatusHistoryProps } from './status-history.value-object.ts';

export interface EnrollmentRequestProps extends DomainEntityProps {
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	statusHistory: StatusHistoryProps[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface EnrollmentRequestEntityReference extends Readonly<EnrollmentRequestProps> {}

export class EnrollmentRequest<props extends EnrollmentRequestProps> extends AggregateRoot<props, Passport> implements EnrollmentRequestEntityReference {
	private isNew: boolean = false;

	public static getNewInstance<props extends EnrollmentRequestProps>(newProps: props, courseId: string, learnerEmail: string, justification: string, status: string, passport: Passport): EnrollmentRequest<props> {
		const newInstance = new EnrollmentRequest(newProps, passport);
		newInstance.markAsNew();
		if (!newInstance.isNew) {
			throw new Error('EnrollmentRequest was not marked as new');
		}
		newInstance.courseId = courseId;
		newInstance.learnerEmail = learnerEmail;
		newInstance.justification = justification;
		newInstance.status = status;
		newInstance.addStatusHistory(
			{
				fromStatus: null,
				toStatus: newInstance.status,
				changedBy: 'system',
				reason: null,
			},
			newInstance.createdAt,
		);
		newInstance.isNew = false;
		return newInstance;
	}

	private markAsNew(): void {
		this.isNew = true;
	}

	get courseId(): string {
		return this.props.courseId;
	}
	set courseId(courseId: string) {
		this.props.courseId = courseId;
	}

	get learnerEmail(): string {
		return this.props.learnerEmail;
	}
	set learnerEmail(learnerEmail: string) {
		this.props.learnerEmail = new ValueObjects.LearnerEmail(learnerEmail).valueOf();
	}

	get justification(): string {
		return this.props.justification;
	}
	set justification(justification: string) {
		this.props.justification = new ValueObjects.Justification(justification).valueOf();
	}

	get status(): string {
		return this.props.status;
	}
	set status(status: string) {
		const value = new ValueObjects.Status(status).valueOf();
		if (!ValueObjects.isEnrollmentRequestStatus(value)) {
			throw new Error('status is not an accepted value');
		}
		this.props.status = value;
	}

	get statusHistory(): StatusHistoryProps[] {
		return this.props.statusHistory.map((entry) => ({ ...entry }));
	}
	set statusHistory(entries: StatusHistoryProps[]) {
		this.props.statusHistory = entries;
	}

	addStatusHistory(entry: Omit<StatusHistoryProps, 'changedAt'>, at: Date): void {
		const history = new StatusHistory({
			fromStatus: entry.fromStatus,
			toStatus: entry.toStatus,
			changedAt: at.toISOString(),
			changedBy: entry.changedBy,
			reason: entry.reason,
		});
		this.statusHistory = [...this.statusHistory, history.toProps()];
		this.recordUpdatedAt(at);
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}

	private recordUpdatedAt(at: Date): void {
		(this.props as { updatedAt: Date }).updatedAt = at;
	}
}
