import { describe, expect, it } from 'vitest';
import { EnrollmentValidationError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each(['a@b.org', 'X.Y@ex.co'])('accepts email %s', (e) => expect(new LearnerEmail(e).value).toBe(e.toLowerCase()));
	it.each(['nope', 'a@b', 'a b@c.d'])('rejects email %s', (e) => expect(() => new LearnerEmail(e)).toThrow(EnrollmentValidationError));
	it.each([20, 500])('accepts justification of %i chars', (n) => expect(new Justification('x'.repeat(n)).value).toHaveLength(n));
	it.each([19, 501])('rejects justification of %i chars', (n) => expect(() => new Justification('x'.repeat(n))).toThrow(EnrollmentValidationError));
	it('guards status', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
