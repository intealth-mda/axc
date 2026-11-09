import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { type EnrollmentStatus, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

const T0 = '2026-01-01T00:00:00.000Z';
const T1 = '2026-01-02T00:00:00.000Z';
const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: new LearnerEmail('a@b.org'), justification: new Justification('x'.repeat(25)) }, T0);

describe('EnrollmentRequest', () => {
	it('starts pending with one history entry', () => {
		const e = make();
		expect(e.props.status).toBe('pending');
		expect(e.isActive).toBe(true);
		expect(e.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: T0, changedBy: 'system', reason: null }]);
	});

	it.each<[EnrollmentStatus[]]>([[['approved']], [['rejected']], [['cancelled']], [['approved', 'cancelled']]])('allows %j and appends history', (path) => {
		const e = make();
		for (const s of path) e.changeStatus(s, 'rev', 'because', T1);
		expect(e.props.status).toBe(path.at(-1));
		expect(e.props.updatedAt).toBe(T1);
		expect(e.props.statusHistory).toHaveLength(path.length + 1);
	});

	it.each<[EnrollmentStatus[], EnrollmentStatus]>([
		[[], 'pending'],
		[['approved'], 'rejected'],
		[['approved'], 'pending'],
		[['rejected'], 'approved'],
		[['cancelled'], 'pending'],
	])('after %j rejects -> %s', (path, to) => {
		const e = make();
		for (const s of path) e.changeStatus(s, 'rev', 'because', T1);
		expect(() => e.changeStatus(to, 'rev', 'because', T1)).toThrow(InvalidStatusTransitionError);
	});

	it.each([null, '', '  '])('rejection needs a reason (%j)', (reason) => {
		const e = make();
		expect(() => e.changeStatus('rejected', 'rev', reason, T1)).toThrow(/reason is required/);
		expect(e.props.statusHistory).toHaveLength(1);
	});
});
