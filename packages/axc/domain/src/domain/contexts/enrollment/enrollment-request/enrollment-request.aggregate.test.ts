import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { InvalidEnrollmentValueError, InvalidStatusTransitionError } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'a@b.co', justification: 'x'.repeat(25) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const r = make().toReference();
		expect(r.status).toBe('pending');
		expect(r.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it('rejects invalid input', () => {
		expect(() => EnrollmentRequest.getNewInstance('e', { courseId: 'c', learnerEmail: 'bad', justification: 'x'.repeat(25) }, 't')).toThrow(InvalidEnrollmentValueError);
		expect(() => EnrollmentRequest.getNewInstance('e', { courseId: 'c', learnerEmail: 'a@b.co', justification: 'short' }, 't')).toThrow(InvalidEnrollmentValueError);
	});
	it('appends history per status change', () => {
		const r = make();
		r.changeStatus('approved', 'rev', undefined, 't1');
		r.changeStatus('cancelled', 'rev', 'no longer needed', 't2');
		const ref = r.toReference();
		expect(ref.status).toBe('cancelled');
		expect(ref.updatedAt).toBe('t2');
		expect(ref.statusHistory.map((h) => `${h.fromStatus}>${h.toStatus}`)).toEqual(['null>pending', 'pending>approved', 'approved>cancelled']);
	});
	it('requires reason to reject, a changer, and a valid transition', () => {
		const r = make();
		expect(() => r.changeStatus('rejected', 'rev', ' ', 't1')).toThrow(InvalidEnrollmentValueError);
		expect(() => r.changeStatus('approved', '', undefined, 't1')).toThrow(InvalidEnrollmentValueError);
		r.changeStatus('rejected', 'rev', 'missing prereq', 't1');
		expect(r.toReference().statusHistory.at(-1)?.reason).toBe('missing prereq');
		expect(() => r.changeStatus('approved', 'rev', undefined, 't2')).toThrow(InvalidStatusTransitionError);
	});
});
