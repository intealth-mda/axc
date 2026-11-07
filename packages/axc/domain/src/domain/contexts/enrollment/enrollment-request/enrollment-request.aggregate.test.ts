import { describe, expect, it } from 'vitest';
import { EnrollmentRequest, InvalidStatusTransition } from './enrollment-request.aggregate.ts';

const props = { id: 'e1', courseId: 'course-001', learnerEmail: 'User@Example.org', justification: 'I need to learn secure development.', createdAt: '2026-01-01T00:00:00.000Z' };
describe('EnrollmentRequest', () => {
	it('starts pending and records each allowed transition', () => {
		const entity = EnrollmentRequest.getNewInstance(props);
		expect(entity.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: props.createdAt, changedBy: 'system', reason: null }]);
		entity.transition('approved', 'reviewer', null, '2026-01-02T00:00:00.000Z');
		entity.transition('cancelled', 'reviewer', 'withdrawn', '2026-01-03T00:00:00.000Z');
		expect(entity.statusHistory.map((x) => x.toStatus)).toEqual(['pending', 'approved', 'cancelled']);
		expect(entity.updatedAt).toBe('2026-01-03T00:00:00.000Z');
	});
	it('supports rejection and cancellation from pending', () => {
		for (const target of ['rejected', 'cancelled'] as const) {
			const entity = EnrollmentRequest.getNewInstance(props);
			entity.transition(target, 'reviewer', target === 'rejected' ? 'not eligible' : null, '2026-01-02T00:00:00.000Z');
			expect(entity.status).toBe(target);
		}
	});
	it('leaves state unchanged on invalid transition or missing reason', () => {
		const entity = EnrollmentRequest.getNewInstance(props);
		expect(() => entity.transition('rejected', 'reviewer', null, 'now')).toThrow();
		expect(() => entity.transition('pending', 'reviewer', null, 'now')).toThrow(InvalidStatusTransition);
		expect(entity.statusHistory).toHaveLength(1);
		expect(entity.status).toBe('pending');
	});
});
