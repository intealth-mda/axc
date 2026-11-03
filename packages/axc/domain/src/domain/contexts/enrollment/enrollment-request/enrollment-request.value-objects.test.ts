import { describe, expect, it } from 'vitest';
import { canTransition, Justification, LearnerEmail, NonEmptyText } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each([
		['a@b.org', true],
		['a@b', false],
		['a b@c.org', false],
		[42, false],
	])('LearnerEmail %s valid=%s', (v, ok) => {
		if (ok) expect(new LearnerEmail(v).value).toBe(v);
		else expect(() => new LearnerEmail(v)).toThrow('learnerEmail must be a valid email address.');
	});
	it('Justification accepts 20..500 characters', () => {
		expect([20, 500].map((n) => new Justification('x'.repeat(n)).value.length)).toEqual([20, 500]);
	});
	it('NonEmptyText trims', () => {
		expect(new NonEmptyText('reason', '  ok ').value).toBe('ok');
	});
	it('canTransition only from pending or approved', () => {
		expect([canTransition('pending', 'approved'), canTransition('approved', 'cancelled'), canTransition('cancelled', 'pending')]).toEqual([true, true, false]);
	});
});
