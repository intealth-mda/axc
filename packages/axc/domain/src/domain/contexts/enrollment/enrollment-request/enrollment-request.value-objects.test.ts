import { describe, expect, it } from 'vitest';
import { canTransition, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment request value objects', () => {
	it.each(['nope', 'a@b', 'a b@c.d'])('rejects email %s', (v) => expect(() => new LearnerEmail(v)).toThrow('learnerEmail'));
	it.each([19, 501])('rejects justification of %i chars', (n) => expect(() => new Justification('x'.repeat(n))).toThrow('justification'));
	it.each([20, 500])('accepts justification of %i chars', (n) => expect(new Justification('x'.repeat(n)).value).toHaveLength(n));
	it('guards status and transitions', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
		expect(canTransition('approved', 'cancelled')).toBe(true);
		expect(canTransition('rejected', 'approved')).toBe(false);
	});
});
