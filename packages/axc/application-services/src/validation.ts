import { invalid, RuleError } from '@axc/domain';
export function object(value: unknown, allowed: readonly string[], code = 'INVALID_REQUEST'): Record<string, unknown> {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new RuleError(code, 'Expected an object.', [{ field: 'request', message: 'Expected an object.' }]);
	const record = value as Record<string, unknown>;
	for (const key of Object.keys(record)) if (!allowed.includes(key)) throw new RuleError(code, 'Unknown parameter.', [{ field: key, message: `Unknown parameter: ${key}.` }]);
	return record;
}
export function optionalText(value: unknown, field: string): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || !value.trim()) invalid(field, `${field} must be a non-empty string.`);
	return value.trim();
}
