import { DomainEntity, type DomainEntityProps, PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { CatalogVisa } from '../catalog.visa.ts';
import * as ValueObjects from './status-history.value-objects.ts';

export interface StatusHistoryProps extends DomainEntityProps {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface StatusHistoryEntityReference extends Readonly<StatusHistoryProps> {}

export class StatusHistory extends DomainEntity<StatusHistoryProps> implements StatusHistoryEntityReference {
	private isNew: boolean = false;
	private readonly visa: CatalogVisa;
	constructor(props: StatusHistoryProps, visa: CatalogVisa) {
		super(props);
		this.visa = visa;
	}

	get fromStatus(): string | null {
		return this.props.fromStatus;
	}
	set fromStatus(fromStatus: string | null) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change fromStatus');
		}
		this.props.fromStatus = fromStatus;
	}

	get toStatus(): string {
		return this.props.toStatus;
	}
	set toStatus(toStatus: string) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change toStatus');
		}
		this.props.toStatus = new ValueObjects.ToStatus(toStatus).valueOf();
	}

	get changedAt(): string {
		return this.props.changedAt;
	}
	set changedAt(changedAt: string) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change changedAt');
		}
		this.props.changedAt = new ValueObjects.ChangedAt(changedAt).valueOf();
	}

	get changedBy(): string {
		return this.props.changedBy;
	}
	set changedBy(changedBy: string) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change changedBy');
		}
		this.props.changedBy = new ValueObjects.ChangedBy(changedBy).valueOf();
	}

	get reason(): string | null {
		return this.props.reason;
	}
	set reason(reason: string | null) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEnrollmentRequest)) {
			throw new PermissionError('You do not have permission to change reason');
		}
		this.props.reason = reason;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
