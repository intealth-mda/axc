import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { type EnrollmentStatus, InvalidEnrollmentFieldError, InvalidStatusTransitionError } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'a@b.co', justification: 'x'.repeat(25) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const r = make().toReference();
		expect(r.status).toBe('pending');
		expect(r.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it.each<[EnrollmentStatus[], EnrollmentStatus]>([
		[[], 'approved'],
		[[], 'rejected'],
		[[], 'cancelled'],
		[['approved'], 'cancelled'],
	])('after %j allows -> %s and appends history', (prior, to) => {
		const r = make();
		for (const s of prior) r.changeStatus(s, 'rev', undefined, 't1');
		r.changeStatus(to, 'rev', 'why', 't2');
		expect(r.toReference().status).toBe(to);
		expect(r.toReference().statusHistory.at(-1)).toEqual({ fromStatus: prior.at(-1) ?? 'pending', toStatus: to, changedAt: 't2', changedBy: 'rev', reason: 'why' });
		expect(r.toReference().updatedAt).toBe('t2');
	});
	it.each<[EnrollmentStatus[], EnrollmentStatus]>([
		[[], 'pending'],
		[['approved'], 'rejected'],
		[['rejected'], 'approved'],
		[['cancelled'], 'pending'],
	])('after %j rejects -> %s', (prior, to) => {
		const r = make();
		for (const s of prior) r.changeStatus(s, 'rev', 'r', 't1');
		expect(() => r.changeStatus(to, 'rev', 'r', 't2')).toThrow(InvalidStatusTransitionError);
	});
	it.each([undefined, '  '])('rejection needs reason (%s)', (reason) => {
		expect(() => make().changeStatus('rejected', 'rev', reason, 't1')).toThrow(InvalidEnrollmentFieldError);
	});
	it('needs changedBy', () => expect(() => make().changeStatus('approved', ' ', undefined, 't1')).toThrow(InvalidEnrollmentFieldError));
});
