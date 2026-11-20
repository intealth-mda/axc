import { describe, expect, it } from 'vitest';
import { canTransition, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each(['bad', 'a@b', 'a b@c.d'])('rejects email %s', (e) => expect(() => new LearnerEmail(e)).toThrow('learnerEmail'));
	it('accepts valid values', () => {
		expect(new LearnerEmail('a@b.org').value).toBe('a@b.org');
		expect(new Justification('x'.repeat(20)).value).toHaveLength(20);
	});
	it.each([19, 501])('rejects justification length %i', (n) => expect(() => new Justification('x'.repeat(n))).toThrow('justification'));
	it('knows transitions and statuses', () => {
		expect(canTransition('pending', 'approved')).toBe(true);
		expect(canTransition('approved', 'cancelled')).toBe(true);
		expect(canTransition('approved', 'rejected')).toBe(false);
		expect(canTransition('cancelled', 'pending')).toBe(false);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
});
