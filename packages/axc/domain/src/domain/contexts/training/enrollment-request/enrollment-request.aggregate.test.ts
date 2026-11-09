import { expect, it } from 'vitest';
import { EnrollmentRequest, type EnrollmentRequestProps } from './enrollment-request.aggregate.ts';

const now = '2026-06-01T00:00:00.000Z';
const later = '2026-06-02T00:00:00.000Z';
const fresh = () => EnrollmentRequest.getNewInstance({ id: 'e' } as EnrollmentRequestProps, 'c', 'L@Example.org', 'x'.repeat(20), now);
it('starts pending with complete creation history', () => {
	const item = fresh();
	expect(item.status).toBe('pending');
	expect(item.createdAt).toBe(now);
	expect(item.updatedAt).toBe(now);
	expect(item.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }]);
});
it.each([
	['pending', 'approved'],
	['pending', 'rejected'],
	['pending', 'cancelled'],
	['approved', 'cancelled'],
])('allows %s to %s with audit fields', (from, to) => {
	const item = fresh();
	if (from === 'approved') item.changeStatus('approved', 'first', undefined, now);
	const previous = item.statusHistory;
	item.changeStatus(to, 'reviewer', to === 'rejected' ? 'Prerequisite missing' : undefined, later);
	expect(item.status).toBe(to);
	expect(item.createdAt).toBe(now);
	expect(item.updatedAt).toBe(later);
	expect(item.statusHistory).toEqual([...previous, { fromStatus: from, toStatus: to, changedAt: later, changedBy: 'reviewer', reason: to === 'rejected' ? 'Prerequisite missing' : null }]);
});
it.each(
	['pending', 'approved', 'rejected', 'cancelled'].flatMap((from) =>
		['pending', 'approved', 'rejected', 'cancelled'].filter((to) => !(from === 'pending' && ['approved', 'rejected', 'cancelled'].includes(to)) && !(from === 'approved' && to === 'cancelled')).map((to) => [from, to]),
	),
)('rejects %s to %s without state change', (from, to) => {
	const item = fresh();
	if (from !== 'pending') item.changeStatus(from, 'first', 'reason', now);
	const before = structuredClone(item.props);
	expect(() => item.changeStatus(to, 'reviewer', 'reason', later)).toThrow(expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }));
	expect(item.props).toEqual(before);
});
it.each([undefined, '', '   '])('requires rejection reason %s without side effects', (reason) => {
	const item = fresh();
	const before = structuredClone(item.props);
	expect(() => item.changeStatus('rejected', 'reviewer', reason, later)).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
	expect(item.props).toEqual(before);
});
it('copies history on reads', () => {
	const item = fresh();
	const history = item.statusHistory;
	(history[0] as { changedBy: string }).changedBy = 'tampered';
	expect(item.statusHistory[0]?.changedBy).toBe('system');
});
it.each([
	{ email: 'bad', justification: 'x'.repeat(20) },
	{ email: 'a@b.org', justification: 'short' },
])('validates direct creation %s', (bad) => expect(() => EnrollmentRequest.getNewInstance({ id: 'e' } as EnrollmentRequestProps, 'c', bad.email, bad.justification, now)).toThrow());
