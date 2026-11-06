import { buildApplicationServicesFactory } from '@axc/application-services';
import { createEnrollmentRequestStore, createSeededCourseCatalog } from '@axc/persistence';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const justification = 'I need this course to prepare for upcoming secure development work.';
const createdAt = '2026-06-27T10:00:00.000Z';
const reviewedAt = '2026-06-27T11:00:00.000Z';

function sequenceClock(times: readonly string[]): () => string {
	let index = 0;
	return () => {
		const value = times[index] ?? times[times.length - 1] ?? createdAt;
		if (index < times.length) {
			index += 1;
		}
		return value;
	};
}

function createApp(now: () => string = () => createdAt) {
	return createRestApp(buildApplicationServicesFactory({ environment: 'test' }, createSeededCourseCatalog(), createEnrollmentRequestStore(), { now }));
}

type App = ReturnType<typeof createApp>;

let app: App;

beforeEach(() => {
	app = createApp();
});

function postEnrollment(body: unknown, target: App = app) {
	return target.request('/api/enrollment-requests', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function patchStatus(id: string, body: unknown, target: App = app) {
	return target.request(`/api/enrollment-requests/${id}/status`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('enrollment request routes', () => {
	it('keeps GET /api/courses working', async () => {
		const response = await app.request('/api/courses?q=security&modality=online&status=active&tag=ai');

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ totalItems: 1, items: [{ id: 'course-001' }] });
	});

	it('creates a pending enrollment request', async () => {
		const response = await postEnrollment({
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification,
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: 'enroll-001',
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification,
			status: 'pending',
			createdAt,
			updatedAt: createdAt,
			statusHistory: [
				{
					fromStatus: null,
					toStatus: 'pending',
					changedAt: createdAt,
					changedBy: 'system',
					reason: null,
				},
			],
		});
	});

	it('returns 404 for a missing course and 409 for a draft or retired course', async () => {
		const missing = await postEnrollment({ courseId: 'course-missing', learnerEmail: 'learner@example.org', justification });
		const draft = await postEnrollment({ courseId: 'course-003', learnerEmail: 'learner@example.org', justification });
		const retired = await postEnrollment({ courseId: 'course-004', learnerEmail: 'learner@example.org', justification });

		expect(missing.status).toBe(404);
		await expect(missing.json()).resolves.toMatchObject({ error: { code: 'COURSE_NOT_FOUND' } });
		expect(draft.status).toBe(409);
		await expect(draft.json()).resolves.toMatchObject({ error: { code: 'COURSE_NOT_ACTIVE' } });
		expect(retired.status).toBe(409);
		await expect(retired.json()).resolves.toMatchObject({ error: { code: 'COURSE_NOT_ACTIVE' } });
	});

	it('returns 400 for an invalid email, a short justification, and unreadable JSON', async () => {
		const invalid = await postEnrollment({ courseId: 'course-001', learnerEmail: 'not-an-email', justification: 'too short' });
		const unreadable = await app.request('/api/enrollment-requests', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{',
		});

		expect(invalid.status).toBe(400);
		await expect(invalid.json()).resolves.toEqual({
			error: {
				code: 'INVALID_REQUEST',
				message: 'The request could not be completed.',
				details: [
					{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' },
					{ field: 'justification', message: 'justification must be between 20 and 500 characters.' },
				],
			},
		});
		expect(unreadable.status).toBe(400);
		await expect(unreadable.json()).resolves.toMatchObject({ error: { code: 'INVALID_REQUEST' } });
	});

	it('prevents a duplicate pending or approved request and allows a request after rejection', async () => {
		const first = await postEnrollment({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		const duplicatePending = await postEnrollment({ courseId: 'course-001', learnerEmail: 'Learner@Example.org', justification });
		expect(duplicatePending.status).toBe(409);
		await expect(duplicatePending.json()).resolves.toMatchObject({ error: { code: 'DUPLICATE_ACTIVE_REQUEST' } });

		const created = (await first.json()) as { id: string };
		const rejected = await patchStatus(created.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Prerequisite is missing from the learner record.' });
		const again = await postEnrollment({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		const approvedLearner = await postEnrollment({ courseId: 'course-002', learnerEmail: 'approved@example.org', justification });
		const approvedBody = (await approvedLearner.json()) as { id: string };
		await patchStatus(approvedBody.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const duplicateApproved = await postEnrollment({ courseId: 'course-002', learnerEmail: 'approved@example.org', justification });

		expect(first.status).toBe(201);
		expect(rejected.status).toBe(200);
		expect(again.status).toBe(201);
		expect(duplicateApproved.status).toBe(409);
	});

	it('returns a request by id and filters the list', async () => {
		const created = await postEnrollment({ courseId: 'course-001', learnerEmail: 'ada@example.org', justification });
		const body = (await created.json()) as { id: string };
		await postEnrollment({ courseId: 'course-002', learnerEmail: 'bea@example.org', justification });

		const byId = await app.request(`/api/enrollment-requests/${body.id}`);
		const filtered = await app.request('/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=ADA@example.org');
		const missing = await app.request('/api/enrollment-requests/enroll-404');
		const invalidFilter = await app.request('/api/enrollment-requests?status=published');

		expect(byId.status).toBe(200);
		await expect(byId.json()).resolves.toMatchObject({
			id: body.id,
			status: 'pending',
			statusHistory: [{ fromStatus: null, toStatus: 'pending', changedBy: 'system' }],
		});
		expect(filtered.status).toBe(200);
		await expect(filtered.json()).resolves.toEqual({
			items: [
				expect.objectContaining({
					id: body.id,
					courseId: 'course-001',
					learnerEmail: 'ada@example.org',
				}),
			],
		});
		expect(missing.status).toBe(404);
		await expect(missing.json()).resolves.toMatchObject({ error: { code: 'ENROLLMENT_REQUEST_NOT_FOUND' } });
		expect(invalidFilter.status).toBe(400);
		await expect(invalidFilter.json()).resolves.toMatchObject({ error: { code: 'INVALID_REQUEST' } });
	});

	it('records valid status transitions and rejects an invalid one', async () => {
		const clock = sequenceClock([createdAt, reviewedAt, '2026-06-27T12:00:00.000Z', '2026-06-27T13:00:00.000Z']);
		const routed = createApp(clock);
		const pending = await postEnrollment({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification }, routed);
		const created = (await pending.json()) as { id: string; createdAt: string };
		const approved = await patchStatus(created.id, { status: 'approved', changedBy: 'reviewer@example.org' }, routed);
		const approvedBody = (await approved.json()) as { status: string; createdAt: string; updatedAt: string; statusHistory: { toStatus: string; changedBy: string; reason: string | null }[] };
		const cancelled = await patchStatus(created.id, { status: 'cancelled', changedBy: 'reviewer@example.org' }, routed);
		const cancelledBody = (await cancelled.json()) as { statusHistory: { toStatus: string }[] };
		const rejected = await postEnrollment({ courseId: 'course-002', learnerEmail: 'reject@example.org', justification }, routed);
		const rejectedCreated = (await rejected.json()) as { id: string };
		const withoutReason = await patchStatus(rejectedCreated.id, { status: 'rejected', changedBy: 'reviewer@example.org' }, routed);
		const withReason = await patchStatus(rejectedCreated.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Learner has not completed the prerequisite course.' }, routed);
		const invalid = await patchStatus(rejectedCreated.id, { status: 'approved', changedBy: 'reviewer@example.org' }, routed);

		expect(approved.status).toBe(200);
		expect(approvedBody.status).toBe('approved');
		expect(approvedBody.createdAt).toBe(createdAt);
		expect(approvedBody.updatedAt).toBe(reviewedAt);
		expect(approvedBody.statusHistory.map((entry) => entry.toStatus)).toEqual(['pending', 'approved']);
		expect(cancelled.status).toBe(200);
		expect(cancelledBody.statusHistory.map((entry) => entry.toStatus)).toEqual(['pending', 'approved', 'cancelled']);
		expect(withoutReason.status).toBe(400);
		await expect(withoutReason.json()).resolves.toMatchObject({
			error: { code: 'INVALID_REQUEST', details: [{ field: 'reason', message: 'reason is required when rejecting a request.' }] },
		});
		expect(withReason.status).toBe(200);
		expect(invalid.status).toBe(409);
		await expect(invalid.json()).resolves.toMatchObject({ error: { code: 'INVALID_STATUS_TRANSITION' } });
	});

	it('cancels a pending request', async () => {
		const created = await postEnrollment({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		const body = (await created.json()) as { id: string };
		const cancelled = await patchStatus(body.id, { status: 'cancelled', changedBy: 'learner@example.org' });
		const cancelledBody = (await cancelled.json()) as { status: string; statusHistory: { fromStatus: string | null; toStatus: string }[] };

		expect(cancelled.status).toBe(200);
		expect(cancelledBody.status).toBe('cancelled');
		expect(cancelledBody.statusHistory.map((entry) => `${entry.fromStatus ?? 'null'}->${entry.toStatus}`)).toEqual(['null->pending', 'pending->cancelled']);
	});
});
