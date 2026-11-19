import { describe, expect, it } from 'vitest';
import { canTransition, InvalidEnrollmentValueError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each(['a@b.co', 'learner@example.org'])('accepts email %s', (e) => expect(new LearnerEmail(e).value).toBe(e));
	it.each(['nope', 'a@b', '@b.co', 'a b@c.de'])('rejects email %s', (e) => expect(() => new LearnerEmail(e)).toThrow(InvalidEnrollmentValueError));
	it.each([
		['x'.repeat(19), false],
		['x'.repeat(20), true],
		['x'.repeat(500), true],
		['x'.repeat(501), false],
	] as const)('justification length', (v, ok) => {
		if (ok) expect(new Justification(v).value).toBe(v);
		else expect(() => new Justification(v)).toThrow('between 20 and 500');
	});
	it.each([
		['pending', 'approved', true],
		['pending', 'rejected', true],
		['pending', 'cancelled', true],
		['approved', 'cancelled', true],
		['approved', 'rejected', false],
		['rejected', 'approved', false],
		['cancelled', 'pending', false],
		['pending', 'pending', false],
	] as const)('%s -> %s is %s', (f, t, ok) => expect(canTransition(f, t)).toBe(ok));
	it('guards status', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
