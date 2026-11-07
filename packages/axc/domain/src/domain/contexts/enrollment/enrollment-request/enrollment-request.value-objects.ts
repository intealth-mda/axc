import { ValueObject } from '@cellix/domain-seedwork/value-object';
export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export class Status extends ValueObject<{ value: EnrollmentStatus }> {
	constructor(value: string) {
		if (!['pending', 'approved', 'rejected', 'cancelled'].includes(value)) throw new Error('Invalid enrollment status');
		super({ value: value as EnrollmentStatus });
	}
	override valueOf(): EnrollmentStatus {
		return this.props.value;
	}
}
export class LearnerEmail extends ValueObject<{ value: string }> {
	constructor(value: string) {
		const normalized = value.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Invalid learner email');
		super({ value: normalized });
	}
	override valueOf() {
		return this.props.value;
	}
}
export class Justification extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim().length < 20 || value.trim().length > 500) throw new Error('Invalid justification');
		super({ value: value.trim() });
	}
	override valueOf() {
		return this.props.value;
	}
}
