import { describe, expect, it } from 'vitest';
import { canTransition, InvalidEnrollmentInputError, isEnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

describe('enrollment request value objects', () => {
	it.each([
		['pending', 'approved', true],
		['pending', 'rejected', true],
		['pending', 'cancelled', true],
		['approved', 'cancelled', true],
		['approved', 'rejected', false],
		['rejected', 'approved', false],
		['cancelled', 'pending', false],
	] as const)('%s -> %s allowed=%s', (from, to, ok) => expect(canTransition(from, to)).toBe(ok));

	it('validates status values', () => {
		expect(isEnrollmentStatus('pending')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});

	it.each(['not-an-email', 'a@b', '', 42])('rejects email %s', (value) => expect(() => new LearnerEmail(value)).toThrow(InvalidEnrollmentInputError));

	it('normalises email to lower case', () => expect(new LearnerEmail('A@Example.org').value).toBe('a@example.org'));

	it.each(['x'.repeat(19), 'x'.repeat(501), undefined])('rejects justification of bad length', (value) => expect(() => new Justification(value)).toThrow(InvalidEnrollmentInputError));

	it.each([20, 500])('accepts justification of %i chars', (n) => expect(new Justification('x'.repeat(n)).value).toHaveLength(n));
});
