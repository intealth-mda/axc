export class WorkflowError extends Error {
	readonly code: string;
	readonly details: ReadonlyArray<{ field: string; message: string }>;
	constructor(code: string, message: string, field?: string) {
		super(message);
		this.name = 'WorkflowError';
		this.code = code;
		this.details = field ? [{ field, message }] : [];
	}
}
export function requiredText(value: unknown, field: string): string {
	if (typeof value !== 'string' || !value.trim()) throw new WorkflowError('INVALID_REQUEST', `${field} must be a non-empty string.`, field);
	return value.trim();
}
