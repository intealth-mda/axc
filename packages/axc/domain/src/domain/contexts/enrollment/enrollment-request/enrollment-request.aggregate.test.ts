import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';

const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'a@b.org', justification: 'x'.repeat(25) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const r = make().toReference();
		expect(r.status).toBe('pending');
		expect(r.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it.each([
		['approved', 'cancelled'],
		['rejected', undefined],
		['cancelled', undefined],
	] as const)('pending -> %s (then %s) appends history', (first, second) => {
		const r = make();
		r.changeStatus(first, 'rev', 'because', 't1');
		if (second) r.changeStatus(second, 'rev', undefined, 't2');
		expect(r.toReference().statusHistory).toHaveLength(second ? 3 : 2);
		expect(r.toReference().updatedAt).toBe(second ? 't2' : 't1');
	});
	it('rejects invalid transitions and reasonless rejection', () => {
		const r = make();
		expect(() => r.changeStatus('rejected', 'rev', ' ', 't1')).toThrow('reason');
		r.changeStatus('cancelled', 'rev', undefined, 't1');
		expect(() => r.changeStatus('approved', 'rev', undefined, 't2')).toThrow('Cannot change status');
		expect(r.isActive).toBe(false);
	});
});
