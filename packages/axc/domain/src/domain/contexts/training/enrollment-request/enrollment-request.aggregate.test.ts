import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';

const make = () => EnrollmentRequest.create('e1', { courseId: 'c1', learnerEmail: 'a@b.org', justification: 'x'.repeat(25) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const r = make().toReference();
		expect(r.status).toBe('pending');
		expect(r.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it('appends history on each change', () => {
		const r = make();
		r.changeStatus('approved', 'rev', undefined, 't1');
		r.changeStatus('cancelled', 'rev', 'moved', 't2');
		expect(r.toReference().statusHistory.map((h) => h.toStatus)).toEqual(['pending', 'approved', 'cancelled']);
		expect(r.toReference().updatedAt).toBe('t2');
	});
	it('rejects invalid transitions and reasonless rejection', () => {
		const r = make();
		expect(() => r.changeStatus('rejected', 'rev', ' ', 't1')).toThrow('reason');
		r.changeStatus('rejected', 'rev', 'no prereq', 't1');
		expect(() => r.changeStatus('approved', 'rev', undefined, 't2')).toThrow('Cannot change');
	});
});
