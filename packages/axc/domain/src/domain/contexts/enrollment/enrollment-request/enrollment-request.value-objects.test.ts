import { describe, expect, it } from 'vitest';
import { InvalidEnrollmentFieldError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each(['a@b.co', 'learner@example.org'])('accepts email %s', (v) => expect(new LearnerEmail(v).value).toBe(v));
	it.each(['', 'nope', 'a@b', 'a b@c.d'])('rejects email %s', (v) => expect(() => new LearnerEmail(v)).toThrow(InvalidEnrollmentFieldError));
	it.each([20, 500])('accepts justification length %i', (n) => expect(new Justification('x'.repeat(n)).value).toHaveLength(n));
	it.each([0, 19, 501])('rejects justification length %i', (n) => expect(() => new Justification('x'.repeat(n))).toThrow(InvalidEnrollmentFieldError));
	it.each([
		['pending', true],
		['done', false],
	])('status %s valid=%s', (v, ok) => expect(isEnrollmentStatus(v)).toBe(ok));
});
