import { ValueObject } from '@cellix/domain-seedwork/value-object';
export type CourseModality = 'online' | 'in-person' | 'hybrid';
export type CourseStatus = 'draft' | 'active' | 'retired';
export class Modality extends ValueObject<{ value: CourseModality }> {
	constructor(value: string) {
		if (!['online', 'in-person', 'hybrid'].includes(value)) throw new Error('Invalid course modality');
		super({ value: value as CourseModality });
	}
	override valueOf(): CourseModality {
		return this.props.value;
	}
}
export class Status extends ValueObject<{ value: CourseStatus }> {
	constructor(value: string) {
		if (!['draft', 'active', 'retired'].includes(value)) throw new Error('Invalid course status');
		super({ value: value as CourseStatus });
	}
	override valueOf(): CourseStatus {
		return this.props.value;
	}
}
