import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { type EnrollmentStatus, InvalidEnrollmentValueError, InvalidStatusTransitionError, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.create('e1', { courseId: 'c1', learnerEmail: new LearnerEmail('a@b.co'), justification: new Justification('x'.repeat(25)) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with one history entry', () => {
		const e = make();
		expect(e.props.status).toBe('pending');
		expect(e.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
		expect(e.isActive).toBe(true);
	});
	it.each<[EnrollmentStatus[], boolean]>([
		[['approved'], true],
		[['rejected'], true],
		[['cancelled'], true],
		[['approved', 'cancelled'], true],
		[['approved', 'rejected'], false],
		[['cancelled', 'approved'], false],
		[['rejected', 'pending'], false],
		[['pending'], false],
	])('transitions %j allowed=%s', (path, ok) => {
		const e = make();
		const run = () => {
			for (const s of path) e.changeStatus(s, 'rev', 'why not', 't1');
		};
		if (ok) {
			run();
			expect(e.props.statusHistory).toHaveLength(path.length + 1);
			expect(e.props.statusHistory.at(-1)).toMatchObject({ toStatus: path.at(-1), changedBy: 'rev', changedAt: 't1' });
		} else expect(run).toThrow(InvalidStatusTransitionError);
	});
	it('rejection needs reason; changedBy needed', () => {
		expect(() => make().changeStatus('rejected', 'rev', ' ', 't1')).toThrow(InvalidEnrollmentValueError);
		expect(() => make().changeStatus('approved', '', undefined, 't1')).toThrow(InvalidEnrollmentValueError);
	});
});
