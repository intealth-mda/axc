import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { invalid } from '../../../errors.ts';
export class Modality extends ValueObject<{ value: 'online' | 'in-person' | 'hybrid' }> {
	constructor(value: unknown) {
		if (value !== 'online' && value !== 'in-person' && value !== 'hybrid') invalid('modality', 'Invalid modality.');
		super({ value });
	}
	get value() {
		return this.props.value;
	}
}
export class CourseStatus extends ValueObject<{ value: 'draft' | 'active' | 'retired' }> {
	constructor(value: unknown) {
		if (value !== 'draft' && value !== 'active' && value !== 'retired') invalid('status', 'Invalid course status.');
		super({ value });
	}
	get value() {
		return this.props.value;
	}
}
