import { describe, expect, it } from 'vitest';
import { EnrollmentValidationError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it('normalizes a valid email and rejects invalid ones', () => {
		expect(new LearnerEmail('A@Example.org').value).toBe('a@example.org');
		expect(() => new LearnerEmail('not-an-email')).toThrow(EnrollmentValidationError);
	});

	it.each([
		['x'.repeat(19), false],
		['x'.repeat(20), true],
		['x'.repeat(500), true],
		['x'.repeat(501), false],
	])('justification length %#', (value, ok) => {
		if (ok) expect(new Justification(value).value).toBe(value);
		else expect(() => new Justification(value)).toThrow('between 20 and 500');
	});

	it('narrows status', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
