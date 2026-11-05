import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { type DomainEntityProps, PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import type { Passport } from '../../passport.ts';
import type { CatalogVisa } from '../catalog.visa.ts';
import * as ValueObjects from './enrollment-request.value-objects.ts';
import { StatusHistory, type StatusHistoryEntityReference, type StatusHistoryProps } from './status-history.entity.ts';

export interface EnrollmentRequestProps extends DomainEntityProps {
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	statusHistory: PropArray<StatusHistoryProps>;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface EnrollmentRequestEntityReference extends Readonly<Omit<EnrollmentRequestProps, 'statusHistory'>> {
	readonly statusHistory: ReadonlyArray<StatusHistoryEntityReference>;
}

export class EnrollmentRequest<props extends EnrollmentRequestProps> extends AggregateRoot<props, Passport> implements EnrollmentRequestEntityReference {
	private isNew: boolean = false;
	private nextChangedBy: string = 'system';
	private nextReason: string | null = null;
	private readonly visa: CatalogVisa;
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.catalog.forEnrollmentRequest(this);
	}

	public static getNewInstance<props extends EnrollmentRequestProps>(
		newProps: props,
		courseId: string,
		learnerEmail: string,
		justification: string,
		status: 'pending' | 'approved' | 'rejected' | 'cancelled',
		passport: Passport,
	): EnrollmentRequest<props> {
		const newInstance = new EnrollmentRequest(newProps, passport);
		newInstance.markAsNew();
		newInstance.courseId = courseId;
		newInstance.learnerEmail = learnerEmail;
		newInstance.justification = justification;
		newInstance.status = status === 'pending' ? status : 'pending';
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
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change courseId');
		}
		this.props.courseId = new ValueObjects.CourseId(courseId).valueOf();
	}

	get learnerEmail(): string {
		return this.props.learnerEmail;
	}
	set learnerEmail(learnerEmail: string) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change learnerEmail');
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(learnerEmail.trim())) {
			throw Object.assign(new Error('learnerEmail must be a valid email address.'), { status: 400, code: 'INVALID_REQUEST', field: 'learnerEmail' });
		}
		this.props.learnerEmail = new ValueObjects.LearnerEmail(learnerEmail).valueOf();
	}

	get justification(): string {
		return this.props.justification;
	}
	set justification(justification: string) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change justification');
		}
		const length = justification.trim().length;
		if (length < 20 || length > 500) {
			throw Object.assign(new Error('justification must be between 20 and 500 characters.'), { status: 400, code: 'INVALID_REQUEST', field: 'justification' });
		}
		this.props.justification = new ValueObjects.Justification(justification).valueOf();
	}

	get status(): 'pending' | 'approved' | 'rejected' | 'cancelled' {
		return this.props.status;
	}
	public prepareStatusChange(changedBy: string, reason: string | null): void {
		this.nextChangedBy = changedBy;
		this.nextReason = reason;
	}

	set status(status: 'pending' | 'approved' | 'rejected' | 'cancelled') {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change status');
		}
		const fromStatus = this.isNew ? null : this.props.status;
		if (!this.isNew) {
			const allowed = (fromStatus === 'pending' && (status === 'approved' || status === 'rejected' || status === 'cancelled')) || (fromStatus === 'approved' && status === 'cancelled');
			if (!allowed) {
				throw Object.assign(new Error('The status transition is not allowed.'), { status: 409, code: 'INVALID_STATUS_TRANSITION', field: 'status' });
			}
			if (status === 'rejected' && (this.nextReason === null || this.nextReason.trim() === '')) {
				throw Object.assign(new Error('reason is required when rejecting a request.'), { status: 400, code: 'INVALID_REQUEST', field: 'reason' });
			}
		}
		this.props.status = status;
		const entry = this.props.statusHistory.getNewItem();
		entry.fromStatus = fromStatus;
		entry.toStatus = status;
		entry.changedAt = new Date().toISOString();
		entry.changedBy = this.nextChangedBy;
		entry.reason = status === 'rejected' ? this.nextReason : null;
	}

	get statusHistory(): ReadonlyArray<StatusHistoryEntityReference> {
		return this.props.statusHistory.items.map((entry) => new StatusHistory(entry, this.visa));
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
}
