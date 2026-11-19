import { describe, expect, it } from 'vitest';
import { EnrollmentRequest, InvalidStatusTransitionError } from './enrollment-request.aggregate.ts';
import { InvalidEnrollmentValueError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.getNewInstance('e1', 'c1', new LearnerEmail('a@b.org'), new Justification('x'.repeat(25)), 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with history', () => {
		const r = make();
		expect(r.props.status).toBe('pending');
		expect(r.isActive).toBe(true);
		expect(r.toJSON().statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it.each([
		['approved', null],
		['rejected', 'no prereq'],
		['cancelled', null],
	] as const)('pending -> %s', (to, reason) => {
		const r = make();
		r.changeStatus(to, 'rev', reason, 't1');
		expect(r.props.status).toBe(to);
		expect(r.props.updatedAt).toBe('t1');
		expect(r.props.statusHistory).toHaveLength(2);
	});
	it('approved -> cancelled, then invalid', () => {
		const r = make();
		r.changeStatus('approved', 'rev', null, 't1');
		r.changeStatus('cancelled', 'rev', null, 't2');
		expect(r.isActive).toBe(false);
		expect(() => r.changeStatus('approved', 'rev', null, 't3')).toThrow(InvalidStatusTransitionError);
		expect(r.props.statusHistory).toHaveLength(3);
	});
	it('rejection needs reason', () => {
		expect(() => make().changeStatus('rejected', 'rev', ' ', 't1')).toThrow(InvalidEnrollmentValueError);
	});
});
