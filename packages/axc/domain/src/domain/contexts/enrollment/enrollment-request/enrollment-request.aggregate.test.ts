import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { type EnrollmentStatus, EnrollmentValidationError, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.create('e1', { courseId: 'c1', learnerEmail: new LearnerEmail('a@b.org'), justification: new Justification('x'.repeat(25)) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const r = make();
		expect(r.props.status).toBe('pending');
		expect(r.isActive).toBe(true);
		expect(r.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});
	it.each<[EnrollmentStatus[], EnrollmentStatus]>([
		[[], 'approved'],
		[[], 'rejected'],
		[[], 'cancelled'],
		[['approved'], 'cancelled'],
	])('after %j allows -> %s and appends history', (path, to) => {
		const r = make();
		for (const s of path) r.changeStatus(s, 'rev', undefined, 't1');
		r.changeStatus(to, 'rev', 'why', 't2');
		expect(r.props.status).toBe(to);
		expect(r.props.updatedAt).toBe('t2');
		expect(r.props.statusHistory).toHaveLength(path.length + 2);
		expect(r.props.statusHistory.at(-1)).toMatchObject({ toStatus: to, changedBy: 'rev', changedAt: 't2' });
	});
	it.each<[EnrollmentStatus, EnrollmentStatus]>([
		['approved', 'rejected'],
		['cancelled', 'approved'],
		['rejected', 'pending'],
	])('rejects %s -> %s', (first, to) => {
		const r = make();
		r.changeStatus(first, 'rev', 'why', 't1');
		expect(() => r.changeStatus(to, 'rev', 'why', 't2')).toThrow(InvalidStatusTransitionError);
	});
	it('rejects pending -> pending', () => expect(() => make().changeStatus('pending', 'rev', undefined, 't')).toThrow(InvalidStatusTransitionError));
	it.each([undefined, '  '])('requires a reason to reject (%j)', (reason) => expect(() => make().changeStatus('rejected', 'rev', reason, 't')).toThrow(EnrollmentValidationError));
});
