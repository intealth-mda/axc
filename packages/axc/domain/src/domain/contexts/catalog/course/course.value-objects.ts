import { ValueObject } from '@cellix/domain-seedwork/value-object';

export class Modality extends ValueObject<{ value: 'online' | 'in-person' | 'hybrid' }> {
	constructor(value: string) {
		if (value !== 'online' && value !== 'in-person' && value !== 'hybrid') throw new Error('Invalid course modality');
		super({ value });
	}
	override valueOf() {
		return this.props.value;
	}
}
export class Status extends ValueObject<{ value: 'draft' | 'active' | 'retired' }> {
	constructor(value: string) {
		if (value !== 'draft' && value !== 'active' && value !== 'retired') throw new Error('Invalid course status');
		super({ value });
	}
	override valueOf() {
		return this.props.value;
	}
}
