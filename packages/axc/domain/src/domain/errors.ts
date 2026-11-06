export class RuleError extends Error {
	readonly code: string;
	readonly details: ReadonlyArray<{ field: string; message: string }>;
	constructor(code: string, message: string, details: ReadonlyArray<{ field: string; message: string }> = []) {
		super(message);
		this.code = code;
		this.details = details;
	}
}
export function invalid(field: string, message: string): never {
	throw new RuleError('INVALID_REQUEST', 'The request could not be completed.', [{ field, message }]);
}
export function text(value: unknown, field: string): string {
	if (typeof value !== 'string' || !value.trim()) invalid(field, `${field} must be a non-empty string.`);
	return value.trim();
}
