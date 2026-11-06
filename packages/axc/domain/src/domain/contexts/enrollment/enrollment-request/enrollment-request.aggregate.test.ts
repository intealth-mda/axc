import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { type EnrollmentStatus, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

const T0 = '2026-06-27T10:00:00.000Z';
const T1 = '2026-06-28T10:00:00.000Z';
const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: new LearnerEmail('l@x.org'), justification: new Justification('x'.repeat(30)) }, T0);
const walk = (path: EnrollmentStatus[]) => {
	const request = make();
	for (const to of path) request.changeStatus(to, 'rev', 'because', T1);
	return request;
};

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const request = make();
		expect(request.props.status).toBe('pending');
		expect(request.isActive).toBe(true);
		expect(request.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: T0, changedBy: 'system', reason: null }]);
	});

	it.each([[['approved']], [['rejected']], [['cancelled']], [['approved', 'cancelled']]] as EnrollmentStatus[][][])('allows %j and appends history', (path) => {
		const request = walk(path);
		expect(request.props.status).toBe(path.at(-1));
		expect(request.props.updatedAt).toBe(T1);
		expect(request.props.statusHistory).toHaveLength(path.length + 1);
		expect(request.props.statusHistory.at(-1)).toMatchObject({ toStatus: path.at(-1), changedBy: 'rev', reason: 'because' });
	});

	it.each([[['pending']], [['approved', 'rejected']], [['rejected', 'approved']], [['cancelled', 'pending']]] as EnrollmentStatus[][][])('rejects %j', (path) => {
		expect(() => walk(path)).toThrow(InvalidStatusTransitionError);
	});

	it('requires a reason to reject', () => {
		expect(() => make().changeStatus('rejected', 'rev', '  ', T1)).toThrow('reason is required');
		expect(walk(['rejected']).isActive).toBe(false);
	});
});
