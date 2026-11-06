import { describe, expect, it } from 'vitest';
import { Justification, LearnerEmail, RequestStatus } from './enrollment-request.value-objects.ts';

describe('enrollment values', () => {
	it('canonicalizes learner identity', () => expect(new LearnerEmail(' LEARNER@Example.org ').value).toBe('learner@example.org'));
	it.each(['bad', 'a@b', 'a@@b.org', 'a b@b.org', null, 2])('rejects email %j', (value) => expect(() => new LearnerEmail(value)).toThrow());
	it.each([19, 501])('rejects justification length %i', (length) => expect(() => new Justification('x'.repeat(length))).toThrow());
	it.each([20, 500])('accepts justification length %i', (length) => expect(new Justification('x'.repeat(length)).value).toHaveLength(length));
	it('rejects whitespace and nonstring justification', () => {
		expect(() => new Justification(' '.repeat(30))).toThrow();
		expect(() => new Justification(null)).toThrow();
	});
	it.each(['pending', 'approved', 'rejected', 'cancelled'])('accepts status %s', (status) => expect(new RequestStatus(status).value).toBe(status));
	it('rejects an unknown status', () => expect(() => new RequestStatus('other')).toThrow());
});
