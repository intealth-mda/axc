import { describe, expect, it } from 'vitest';
import { InvalidEnrollmentValueError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each(['a@b.co', 'learner@example.org'])('accepts email %s', (e) => expect(new LearnerEmail(e).value).toBe(e));
	it.each(['nope', 'a@b', 'a b@c.de'])('rejects email %s', (e) => expect(() => new LearnerEmail(e)).toThrow(InvalidEnrollmentValueError));
	it.each([
		['x'.repeat(19), false],
		['x'.repeat(20), true],
		['x'.repeat(500), true],
		['x'.repeat(501), false],
	])('justification length %#', (v, ok) => (ok ? expect(new Justification(v).value).toBe(v) : expect(() => new Justification(v)).toThrow(InvalidEnrollmentValueError)));
	it('status guard', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
