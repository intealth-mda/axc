import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { InvalidEnrollmentInputError, InvalidStatusTransitionError } from './enrollment-request.value-objects.ts';

const T0 = '2026-06-27T10:00:00.000Z';
const T1 = '2026-06-28T10:00:00.000Z';
const make = () => EnrollmentRequest.create('e1', { courseId: 'course-001', learnerEmail: 'Learner@Example.org', justification: 'I need this course for my upcoming work.' }, T0);

describe('EnrollmentRequest', () => {
	it('starts pending with an initial history entry', () => {
		const r = make();
		expect(r.props.status).toBe('pending');
		expect(r.props.learnerEmail).toBe('learner@example.org');
		expect(r.isActive).toBe(true);
		expect(r.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: T0, changedBy: 'system', reason: null }]);
	});

	it('requires courseId', () => {
		expect(() => EnrollmentRequest.create('e1', { courseId: '', learnerEmail: 'a@b.co', justification: 'x'.repeat(20) }, T0)).toThrow(InvalidEnrollmentInputError);
	});

	it('appends history on each status change', () => {
		const r = make();
		r.changeStatus('approved', 'rev@example.org', undefined, T1);
		r.changeStatus('cancelled', 'rev@example.org', 'changed plans', T1);
		expect(r.props.status).toBe('cancelled');
		expect(r.props.updatedAt).toBe(T1);
		expect(r.isActive).toBe(false);
		expect(r.props.statusHistory.map((h) => [h.fromStatus, h.toStatus, h.reason])).toEqual([
			[null, 'pending', null],
			['pending', 'approved', null],
			['approved', 'cancelled', 'changed plans'],
		]);
	});

	it.each([
		['bogus', 'rev', 'x'],
		['approved', '', 'x'],
		['rejected', 'rev', '  '],
	])('rejects invalid input status=%s changedBy=%s reason=%s', (status, by, reason) => {
		expect(() => make().changeStatus(status, by, reason, T1)).toThrow(InvalidEnrollmentInputError);
	});

	it('rejects invalid transitions', () => {
		const r = make();
		r.changeStatus('rejected', 'rev', 'no prerequisite', T1);
		expect(() => r.changeStatus('approved', 'rev', undefined, T1)).toThrow(InvalidStatusTransitionError);
	});
});
