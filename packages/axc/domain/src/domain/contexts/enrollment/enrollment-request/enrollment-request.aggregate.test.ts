import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { InvalidEnrollmentValueError, InvalidStatusTransitionError } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'a@b.org', justification: 'I need this course for my work.' }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const e = make();
		expect(e.props.status).toBe('pending');
		expect(e.isActive).toBe(true);
		expect(e.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it('appends history on each change', () => {
		const e = make();
		e.changeStatus('approved', 'rev', undefined, 't1');
		e.changeStatus('cancelled', 'rev', 'no longer needed', 't2');
		expect(e.props.statusHistory.map((h) => `${h.fromStatus}>${h.toStatus}`)).toEqual(['null>pending', 'pending>approved', 'approved>cancelled']);
		expect(e.props.updatedAt).toBe('t2');
		expect(e.isActive).toBe(false);
	});
	it('rejects invalid transitions and missing reason', () => {
		const e = make();
		expect(() => e.changeStatus('rejected', 'rev', ' ', 't1')).toThrow(InvalidEnrollmentValueError);
		expect(() => e.changeStatus('pending', 'rev', undefined, 't1')).toThrow(InvalidStatusTransitionError);
		expect(() => e.changeStatus('approved', '', undefined, 't1')).toThrow(InvalidEnrollmentValueError);
		e.changeStatus('rejected', 'rev', 'Missing prerequisite', 't1');
		expect(() => e.changeStatus('cancelled', 'rev', undefined, 't2')).toThrow(InvalidStatusTransitionError);
	});
});
