import { ValueObject, type ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { VOOptional, VOString } from '@lucaspaganini/value-objects';
import { isEnrollmentRequestStatus } from './enrollment-request.value-objects.ts';

class ToStatusBase extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 9,
}) {}

export class ToStatus extends ToStatusBase {}

class ReasonBase extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 500,
}) {}

export class Reason extends VOOptional(ReasonBase, [null]) {}

export interface StatusHistoryProps extends ValueObjectProps {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

export class StatusHistory extends ValueObject<StatusHistoryProps> {
	constructor(props: StatusHistoryProps) {
		super({
			fromStatus: null,
			toStatus: 'pending',
			changedAt: props.changedAt,
			changedBy: props.changedBy,
			reason: null,
		});
		this.fromStatus = props.fromStatus;
		this.toStatus = props.toStatus;
		this.changedAt = props.changedAt;
		this.changedBy = props.changedBy;
		this.reason = props.reason;
	}

	get fromStatus(): string | null {
		return this.props.fromStatus;
	}
	set fromStatus(fromStatus: string | null) {
		this.props.fromStatus = fromStatus;
	}

	get toStatus(): string {
		return this.props.toStatus;
	}
	set toStatus(toStatus: string) {
		const value = new ToStatus(toStatus).valueOf();
		if (!isEnrollmentRequestStatus(value)) {
			throw new Error('toStatus is not an accepted value');
		}
		this.props.toStatus = value;
	}

	get changedAt(): string {
		return this.props.changedAt;
	}
	set changedAt(changedAt: string) {
		if (changedAt.length === 0) {
			throw new Error('changedAt is required');
		}
		this.props.changedAt = changedAt;
	}

	get changedBy(): string {
		return this.props.changedBy;
	}
	set changedBy(changedBy: string) {
		if (changedBy.length === 0) {
			throw new Error('changedBy is required');
		}
		this.props.changedBy = changedBy;
	}

	get reason(): string | null {
		return this.props.reason;
	}
	set reason(reason: string | null) {
		this.props.reason = new Reason(reason).valueOf();
	}

	toProps(): StatusHistoryProps {
		return {
			fromStatus: this.fromStatus,
			toStatus: this.toStatus,
			changedAt: this.changedAt,
			changedBy: this.changedBy,
			reason: this.reason,
		};
	}
}
