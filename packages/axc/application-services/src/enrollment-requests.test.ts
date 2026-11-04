import { describe, expect, it } from 'vitest';
import { ApplicationError, type ApplicationErrorCode, applicationErrorStatus } from './index.ts';
import { createTestApplicationServices } from './test-support.ts';

const justification = 'I need this course to prepare for upcoming secure development work.';

describe('enrollment requests', () => {
	it('creates a pending request and an initial history entry', async () => {
		const created = await (await services()).enrollmentRequests.create({
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification,
		});

		expect(created).toMatchObject({
			id: 'enroll-001',
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification,
			status: 'pending',
			createdAt: '2026-06-27T10:00:00.000Z',
			updatedAt: '2026-06-27T10:00:00.000Z',
		});
		expect(created.statusHistory).toEqual([
			{
				fromStatus: null,
				toStatus: 'pending',
				changedAt: '2026-06-27T10:00:00.000Z',
				changedBy: 'system',
				reason: null,
			},
		]);
	});

	it('rejects a missing, draft, or retired course', async () => {
		const api = await services();
		expectCode(await capture(() => api.enrollmentRequests.create(requestBody('course-404'))), 'COURSE_NOT_FOUND', 404);
		expectCode(await capture(() => api.enrollmentRequests.create(requestBody('course-003'))), 'COURSE_NOT_ACTIVE', 409);
		expectCode(await capture(() => api.enrollmentRequests.create(requestBody('course-004'))), 'COURSE_NOT_ACTIVE', 409);
	});

	it('rejects an invalid email and a justification outside 20 to 500 characters', async () => {
		const api = await services();
		const invalid = await capture(() =>
			api.enrollmentRequests.create({
				courseId: 'course-001',
				learnerEmail: 'not-an-email',
				justification: 'too short',
			}),
		);
		expectCode(invalid, 'INVALID_REQUEST', 400);
		expect(invalid.details).toEqual([
			{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' },
			{ field: 'justification', message: 'justification must be between 20 and 500 characters.' },
		]);
		expectCode(await capture(() => api.enrollmentRequests.create(requestBody('course-001', { justification: 'a'.repeat(501) }))), 'INVALID_REQUEST', 400);
		const longest = await api.enrollmentRequests.create(requestBody('course-008', { justification: 'a'.repeat(500) }));
		expect(longest.justification).toHaveLength(500);
		const shortest = await api.enrollmentRequests.create(requestBody('course-010', { justification: 'a'.repeat(20) }));
		expect(shortest.justification).toHaveLength(20);
	});

	it('prevents a second pending or approved request for the same learner and course', async () => {
		const api = await services();
		await api.enrollmentRequests.create(requestBody('course-001'));
		expectCode(await capture(() => api.enrollmentRequests.create(requestBody('course-001', { learnerEmail: 'Learner@example.org' }))), 'DUPLICATE_ACTIVE_REQUEST', 409);
		const otherCourse = await api.enrollmentRequests.create(requestBody('course-008'));
		expect(otherCourse.status).toBe('pending');

		const approved = await services();
		const created = await approved.enrollmentRequests.create(requestBody('course-001'));
		await approved.enrollmentRequests.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		expectCode(await capture(() => approved.enrollmentRequests.create(requestBody('course-001'))), 'DUPLICATE_ACTIVE_REQUEST', 409);
	});

	it('allows a new request after rejection', async () => {
		const api = await services();
		const created = await api.enrollmentRequests.create(requestBody('course-001'));
		await api.enrollmentRequests.updateStatus(created.id, {
			status: 'rejected',
			changedBy: 'reviewer@example.org',
			reason: 'Missing prerequisite work.',
		});
		const next = await api.enrollmentRequests.create(requestBody('course-001'));
		expect(next.status).toBe('pending');
		expect(next.id).toBe('enroll-002');
	});

	it('returns a stored request with its history', async () => {
		const api = await services();
		const created = await api.enrollmentRequests.create(requestBody('course-001'));
		const found = await api.enrollmentRequests.get(created.id);
		expect(found).toEqual(created);
		expectCode(await capture(() => api.enrollmentRequests.get('missing')), 'ENROLLMENT_REQUEST_NOT_FOUND', 404);
	});

	it('filters by status, courseId, and learnerEmail', async () => {
		const api = await services();
		await api.enrollmentRequests.create(requestBody('course-001', { learnerEmail: 'learner.a@example.org' }));
		const second = await api.enrollmentRequests.create(requestBody('course-001', { learnerEmail: 'learner.b@example.org' }));
		await api.enrollmentRequests.updateStatus(second.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		await api.enrollmentRequests.create(requestBody('course-008', { learnerEmail: 'learner.a@example.org' }));

		expect((await api.enrollmentRequests.list({ status: 'approved' })).items.map((item) => item.id)).toEqual(['enroll-002']);
		expect((await api.enrollmentRequests.list({ courseId: 'course-001' })).items).toHaveLength(2);
		expect((await api.enrollmentRequests.list({ learnerEmail: 'LEARNER.A@example.org' })).items).toHaveLength(2);
		const combined = await api.enrollmentRequests.list({ status: 'pending', courseId: 'course-008', learnerEmail: 'learner.a@example.org' });
		expect(combined.items.map((item) => item.courseId)).toEqual(['course-008']);
		expectCode(await capture(() => api.enrollmentRequests.list({ status: 'closed' })), 'INVALID_REQUEST', 400);
	});

	it('applies valid transitions and appends history', async () => {
		const approved = await transition('approved');
		expect(approved.status).toBe('approved');
		expect(approved.statusHistory.map((entry) => entry.toStatus)).toEqual(['pending', 'approved']);
		expect(approved.statusHistory[1]).toMatchObject({ fromStatus: 'pending', changedBy: 'reviewer@example.org', reason: null });

		const rejected = await transition('rejected', 'Missing prerequisite work.');
		expect(rejected.statusHistory[1]).toMatchObject({ fromStatus: 'pending', toStatus: 'rejected', reason: 'Missing prerequisite work.' });

		const cancelled = await transition('cancelled');
		expect(cancelled.status).toBe('cancelled');

		const api = await services();
		const created = await api.enrollmentRequests.create(requestBody('course-001'));
		await api.enrollmentRequests.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const closed = await api.enrollmentRequests.updateStatus(created.id, { status: 'cancelled', changedBy: 'reviewer@example.org' });
		expect(closed.statusHistory.map((entry) => [entry.fromStatus, entry.toStatus])).toEqual([
			[null, 'pending'],
			['pending', 'approved'],
			['approved', 'cancelled'],
		]);
	});

	it('rejects an invalid transition', async () => {
		const api = await services();
		const created = await api.enrollmentRequests.create(requestBody('course-001'));
		await api.enrollmentRequests.updateStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const error = await capture(() =>
			api.enrollmentRequests.updateStatus(created.id, {
				status: 'rejected',
				changedBy: 'reviewer@example.org',
				reason: 'Too late.',
			}),
		);
		expectCode(error, 'INVALID_STATUS_TRANSITION', 409);
	});

	it('requires a reason to reject', async () => {
		const api = await services();
		const created = await api.enrollmentRequests.create(requestBody('course-001'));
		const missing = await capture(() => api.enrollmentRequests.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org' }));
		expectCode(missing, 'INVALID_REQUEST', 400);
		expect(missing.details).toEqual([{ field: 'reason', message: 'reason is required when rejecting a request.' }]);
		const blank = await capture(() => api.enrollmentRequests.updateStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: '   ' }));
		expectCode(blank, 'INVALID_REQUEST', 400);
	});

	it('rejects an invalid status value', async () => {
		const api = await services();
		const created = await api.enrollmentRequests.create(requestBody('course-001'));
		const error = await capture(() => api.enrollmentRequests.updateStatus(created.id, { status: 'closed', changedBy: 'reviewer@example.org' }));
		expectCode(error, 'INVALID_REQUEST', 400);
		expect(error.details[0]?.field).toBe('status');
	});
});

function services() {
	return createTestApplicationServices().forRequest();
}

function requestBody(courseId: string, overrides: { learnerEmail?: string; justification?: string } = {}) {
	return {
		courseId,
		learnerEmail: overrides.learnerEmail ?? 'learner@example.org',
		justification: overrides.justification ?? justification,
	};
}

async function transition(status: 'approved' | 'rejected' | 'cancelled', reason?: string) {
	const api = await services();
	const created = await api.enrollmentRequests.create(requestBody('course-001'));
	return api.enrollmentRequests.updateStatus(created.id, { status, changedBy: 'reviewer@example.org', ...(reason === undefined ? {} : { reason }) });
}

async function capture(run: () => Promise<unknown>): Promise<ApplicationError> {
	try {
		await run();
	} catch (error) {
		expect(error).toBeInstanceOf(ApplicationError);
		if (error instanceof ApplicationError) {
			return error;
		}
	}
	throw new Error('expected ApplicationError');
}

function expectCode(error: ApplicationError, code: ApplicationErrorCode, status: number): void {
	expect(error.code).toBe(code);
	expect(applicationErrorStatus[error.code]).toBe(status);
}
