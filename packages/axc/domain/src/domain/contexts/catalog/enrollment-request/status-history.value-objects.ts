import { VOString } from '@lucaspaganini/value-objects';

export class ToStatus extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class ChangedAt extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class ChangedBy extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
