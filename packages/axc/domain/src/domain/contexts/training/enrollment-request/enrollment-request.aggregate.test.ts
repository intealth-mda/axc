import { describe, expect, it } from 'vitest';
import { EnrollmentRequest, type EnrollmentRequestProps } from './enrollment-request.aggregate.ts';

const course = { id: 'c', status: 'active' };
function create() {
	return EnrollmentRequest.getNewInstance({ id: 'e' } as EnrollmentRequestProps, course as never, 'a@example.org', 'x'.repeat(20), '2026-01-01T00:00:00.000Z');
}
describe('enrollment aggregate', () => {
	it('initializes pending with immutable history snapshots', () => {
		const request = create();
		expect(request.status).toBe('pending');
		expect(request.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: request.createdAt, changedBy: 'system', reason: null }]);
		const history = request.statusHistory;
		history.pop();
		expect(request.statusHistory).toHaveLength(1);
	});
	for (const from of ['pending', 'approved', 'rejected', 'cancelled'] as const)
		for (const to of ['pending', 'approved', 'rejected', 'cancelled'] as const) {
			const valid = (from === 'pending' && to !== 'pending') || (from === 'approved' && to === 'cancelled');
			it(`${from} -> ${to}: ${valid}`, () => {
				const request = create();
				if (from !== 'pending') request.changeStatus(from, 'first', 'reason');
				const before = structuredClone(request.props);
				if (valid) {
					request.changeStatus(to, 'reviewer', 'reason', '2026-02-01T00:00:00.000Z');
					expect(request.status).toBe(to);
					expect(request.statusHistory.at(-1)).toEqual({ fromStatus: from, toStatus: to, changedAt: request.updatedAt, changedBy: 'reviewer', reason: 'reason' });
				} else {
					expect(() => request.changeStatus(to, 'reviewer', 'reason')).toThrow(expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }));
					expect(request.props).toEqual(before);
				}
			});
		}
	it.each([undefined, '', '   '])('requires rejection reason %j', (reason) => {
		const request = create();
		expect(() => request.changeStatus('rejected', 'reviewer', reason)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
		expect(request.statusHistory).toHaveLength(1);
	});
	it('validates values and course directly', () => {
		expect(() => EnrollmentRequest.getNewInstance({ id: 'e' } as EnrollmentRequestProps, { ...course, status: 'draft' } as never, 'a@example.org', 'x'.repeat(20))).toThrow(expect.objectContaining({ code: 'COURSE_NOT_ACTIVE' }));
		expect(() => create().changeStatus('approved', ' ')).toThrow();
		expect(() => create().changeStatus('bad', 'reviewer')).toThrow();
		expect(() => create().changeStatus('approved', 'reviewer', 2)).toThrow();
	});
});
