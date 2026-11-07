import { describe, expect, it } from 'vitest';
import { Justification, LearnerEmail, Status } from './enrollment-request.value-objects.ts';

describe('enrollment values', () => {
	it('normalizes email and accepts valid statuses', () => {
		expect(new LearnerEmail(' User@Example.org ').valueOf()).toBe('user@example.org');
		for (const value of ['pending', 'approved', 'rejected', 'cancelled']) expect(new Status(value).valueOf()).toBe(value);
	});
	it('rejects invalid values', () => {
		expect(() => new LearnerEmail('no-at')).toThrow();
		expect(() => new Justification('short')).toThrow();
		expect(() => new Justification('x'.repeat(501))).toThrow();
		expect(() => new Status('open')).toThrow();
	});
});
