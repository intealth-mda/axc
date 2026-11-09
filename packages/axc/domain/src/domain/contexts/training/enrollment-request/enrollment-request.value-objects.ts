import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { requiredText, WorkflowError } from '../errors.ts';
export class EnrollmentStatus extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		if (typeof value !== 'string' || !['pending', 'approved', 'rejected', 'cancelled'].includes(value)) throw new WorkflowError('INVALID_REQUEST', 'Invalid enrollment status.', 'status');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		const email = requiredText(value, 'learnerEmail').toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new WorkflowError('INVALID_REQUEST', 'learnerEmail must be a valid email address.', 'learnerEmail');
		super({ value: email });
	}
	get value(): string {
		return this.props.value;
	}
}
export class Justification extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		const text = requiredText(value, 'justification');
		if (text.length < 20 || text.length > 500) throw new WorkflowError('INVALID_REQUEST', 'justification must be between 20 and 500 characters.', 'justification');
		super({ value: text });
	}
	get value(): string {
		return this.props.value;
	}
}
