import { describe, expect, it } from 'vitest';
import { systemCatalogPassport } from '../catalog.passport.ts';
import { EnrollmentRequest, InvalidEnrollmentTransition } from './enrollment-request.aggregate.ts';

const createdAt = '2026-06-27T10:00:00.000Z';

function pendingRequest(): EnrollmentRequest {
	return EnrollmentRequest.requestNew(
		{
			id: 'enroll-001',
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification: 'I need this course to prepare for upcoming secure development work.',
			createdAt,
		},
		systemCatalogPassport,
	);
}

describe('EnrollmentRequest aggregate', () => {
	it('opens a pending request with a creation audit entry', () => {
		const request = pendingRequest();

		expect(request.props.status).toBe('pending');
		expect(request.props.statusHistory).toEqual([
			{
				fromStatus: null,
				toStatus: 'pending',
				changedAt: createdAt,
				changedBy: 'system',
				reason: null,
			},
		]);
	});

	it('records a valid status change', () => {
		const request = pendingRequest();
		request.changeStatus('approved', 'reviewer@example.org', '2026-06-27T11:00:00.000Z', null);

		expect(request.props.status).toBe('approved');
		expect(request.props.statusHistory).toHaveLength(2);
		const recorded = request.props.statusHistory[1];
		if (recorded === undefined) {
			throw new Error('status history entry was not recorded');
		}
		expect(recorded).toEqual({
			fromStatus: 'pending',
			toStatus: 'approved',
			changedAt: '2026-06-27T11:00:00.000Z',
			changedBy: 'reviewer@example.org',
			reason: null,
		});
	});

	it('rejects an invalid transition', () => {
		const request = pendingRequest();
		request.changeStatus('approved', 'reviewer@example.org', '2026-06-27T11:00:00.000Z', null);

		expect(() => request.changeStatus('rejected', 'reviewer@example.org', '2026-06-27T12:00:00.000Z', 'Too late.')).toThrow(InvalidEnrollmentTransition);
		expect(request.props.statusHistory).toHaveLength(2);
	});
});
