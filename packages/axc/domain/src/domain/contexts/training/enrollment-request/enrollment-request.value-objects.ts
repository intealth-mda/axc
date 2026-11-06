import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { invalid } from '../../../errors.ts';
export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim())) invalid('learnerEmail', 'learnerEmail must be a valid email address.');
		super({ value: value.trim().toLowerCase() });
	}
	get value() {
		return this.props.value;
	}
}
export class Justification extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		if (typeof value !== 'string' || value.trim().length < 20 || value.trim().length > 500) invalid('justification', 'justification must be between 20 and 500 characters.');
		super({ value: value.trim() });
	}
	get value() {
		return this.props.value;
	}
}
export class RequestStatus extends ValueObject<{ value: 'pending' | 'approved' | 'rejected' | 'cancelled' }> {
	constructor(value: unknown) {
		if (value !== 'pending' && value !== 'approved' && value !== 'rejected' && value !== 'cancelled') invalid('status', 'Invalid enrollment request status.');
		super({ value });
	}
	get value() {
		return this.props.value;
	}
}
