import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { EnrollmentValidationError, InvalidStatusTransitionError } from './enrollment-request.value-objects.ts';

const now = '2026-06-27T10:00:00.000Z';
const valid = { courseId: 'c1', learnerEmail: 'a@example.org', justification: 'x'.repeat(20) };
const create = () => EnrollmentRequest.getNewInstance('e1', valid, now);

describe('EnrollmentRequest', () => {
	it('starts pending with a creation history entry', () => {
		const r = create();
		expect(r.props.status).toBe('pending');
		expect(r.props.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: now, changedBy: 'system', reason: null }]);
	});

	it.each([
		['learnerEmail', { ...valid, learnerEmail: 'not-an-email' }],
		['justification', { ...valid, justification: 'x'.repeat(19) }],
		['justification', { ...valid, justification: 'x'.repeat(501) }],
	])('rejects invalid %s', (field, input) => {
		expect(() => EnrollmentRequest.getNewInstance('e1', input, now)).toThrow(expect.objectContaining({ field }));
	});

	it.each([
		[[], 'approved'],
		[[], 'rejected'],
		[[], 'cancelled'],
		[['approved'], 'cancelled'],
	])('after %j allows -> %s and records history', (path, to) => {
		const r = create();
		for (const s of [...path, to]) r.changeStatus(s, 'rev', 'because', now);
		expect(r.props.status).toBe(to);
		expect(r.props.statusHistory).toHaveLength(path.length + 2);
		expect(r.props.statusHistory.at(-1)).toMatchObject({ toStatus: to, changedBy: 'rev' });
	});

	it.each([
		[['rejected'], 'approved'],
		[['cancelled'], 'pending'],
		[['approved'], 'rejected'],
		[[], 'pending'],
	])('after %j refuses -> %s', (path, to) => {
		const r = create();
		for (const s of path) r.changeStatus(s, 'rev', 'because', now);
		expect(() => r.changeStatus(to, 'rev', 'because', now)).toThrow(InvalidStatusTransitionError);
	});

	it.each([
		['status', 'bogus', 'rev', undefined],
		['changedBy', 'approved', ' ', undefined],
		['reason', 'rejected', 'rev', '  '],
	])('validates %s', (field, status, by, reason) => {
		expect(() => create().changeStatus(status, by, reason, now)).toThrow(EnrollmentValidationError);
		expect(() => create().changeStatus(status, by, reason, now)).toThrow(expect.objectContaining({ field }));
	});
});
