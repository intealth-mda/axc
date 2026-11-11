import { describe, expect, it } from 'vitest';
import { EnrollmentValidationError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each(['a@b.co', 'learner@example.org'])('accepts email %s', (v) => expect(new LearnerEmail(v).value).toBe(v));
	it.each(['', 'nope', 'a@b', 'a b@c.de'])('rejects email %s', (v) => expect(() => new LearnerEmail(v)).toThrow(EnrollmentValidationError));
	it.each([20, 500])('accepts justification of %i chars', (n) => expect(new Justification('x'.repeat(n)).value).toHaveLength(n));
	it.each([19, 501])('rejects justification of %i chars', (n) => expect(() => new Justification('x'.repeat(n))).toThrow(/between 20 and 500/));
	it('guards status', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
