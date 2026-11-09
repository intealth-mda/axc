import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { WorkflowError } from '../errors.ts';
export class CourseModality extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		if (typeof value !== 'string' || !['online', 'in-person', 'hybrid'].includes(value)) throw new WorkflowError('INVALID_REQUEST', 'Invalid course modality.', 'modality');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
export class CourseStatus extends ValueObject<{ value: string }> {
	constructor(value: unknown) {
		if (typeof value !== 'string' || !['draft', 'active', 'retired'].includes(value)) throw new WorkflowError('INVALID_REQUEST', 'Invalid course status.', 'status');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
