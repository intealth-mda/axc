import { describe, expect, it } from 'vitest';
import { canTransition, InvalidEnrollmentValueError, isEnrollmentStatus, Justification, LearnerEmail, NonEmptyText } from './enrollment-request.value-objects.ts';

describe('enrollment value objects', () => {
	it.each([
		['pending', 'approved', true],
		['pending', 'rejected', true],
		['pending', 'cancelled', true],
		['approved', 'cancelled', true],
		['approved', 'rejected', false],
		['rejected', 'pending', false],
		['cancelled', 'approved', false],
	] as const)('%s -> %s is %s', (from, to, ok) => {
		expect(canTransition(from, to)).toBe(ok);
	});
	it('guards status', () => {
		expect(isEnrollmentStatus('approved')).toBe(true);
		expect(isEnrollmentStatus('done')).toBe(false);
	});
	it.each([() => new LearnerEmail('bad-email'), () => new Justification('too short'), () => new Justification('x'.repeat(501)), () => new NonEmptyText('reason', '  ')])('rejects invalid value %#', (make) => {
		expect(make).toThrow(InvalidEnrollmentValueError);
	});
	it('accepts valid values', () => {
		expect(new LearnerEmail('a@b.org').value).toBe('a@b.org');
		expect(new Justification('x'.repeat(20)).value).toHaveLength(20);
	});
});
