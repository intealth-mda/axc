import { describe, expect, it } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import { EnrollmentValidationError, InvalidStatusTransitionError } from './enrollment-request.value-objects.ts';

const make = () => EnrollmentRequest.getNewInstance('e1', { courseId: 'c1', learnerEmail: 'l@x.org', justification: 'x'.repeat(25) }, 't0');

describe('EnrollmentRequest', () => {
	it('starts pending with one history entry', () => {
		const r = make().toReference();
		expect(r.status).toBe('pending');
		expect(r.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: 't0', changedBy: 'system', reason: null }]);
	});

	it('rejects bad input', () => {
		expect(() => EnrollmentRequest.getNewInstance('e', { courseId: 'c', learnerEmail: 'bad', justification: 'x'.repeat(25) }, 't')).toThrow(EnrollmentValidationError);
	});

	it.each([
		[['approved'], true],
		[['rejected'], false],
		[['cancelled'], false],
		[['approved', 'cancelled'], false],
	] as const)('valid path %j, active after: %s', (path, active) => {
		const r = make();
		for (const s of path) r.changeStatus(s, 'rev', 'why not', 't1');
		expect(r.props.status).toBe(path.at(-1));
		expect(r.props.statusHistory).toHaveLength(path.length + 1);
		expect(r.props.updatedAt).toBe('t1');
		expect(r.isActive).toBe(active);
	});

	it.each([[['rejected', 'approved']], [['cancelled', 'pending']], [['pending']], [['approved', 'rejected']]] as const)('invalid path %j throws', (path) => {
		const r = make();
		expect(() => {
			for (const s of path) r.changeStatus(s, 'rev', 'why', 't1');
		}).toThrow(InvalidStatusTransitionError);
	});

	it.each([null, '  '])('rejection needs reason (%j)', (reason) => {
		expect(() => make().changeStatus('rejected', 'rev', reason, 't')).toThrow(/reason/);
	});

	it('requires changedBy', () => expect(() => make().changeStatus('approved', ' ', null, 't')).toThrow(/changedBy/));
});
