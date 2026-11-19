import { describe, expect, it } from 'vitest';
import { InvalidEnrollmentValueError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it('validates email', () => {
		expect(new LearnerEmail('A@b.org').value).toBe('a@b.org');
		expect(() => new LearnerEmail('nope')).toThrow(InvalidEnrollmentValueError);
	});
	it.each([
		['x'.repeat(19), false],
		['x'.repeat(20), true],
		['x'.repeat(500), true],
		['x'.repeat(501), false],
	])('justification %#', (v, ok) => {
		if (ok) expect(new Justification(v).value).toBe(v);
		else expect(() => new Justification(v)).toThrow('between 20 and 500');
	});
	it('guards status', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
