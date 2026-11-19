import { buildApplicationServicesFactory, type CoursePage, type EnrollmentRequestItem, type EnrollmentRequestList } from '@axc/application-services';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

interface ErrorBody {
	error: {
		code: string;
		message: string;
		details: Array<{ field: string; message: string }>;
	};
}

const justification = 'I need this course to prepare for upcoming secure development work.';

let app: ReturnType<typeof createRestApp>;

beforeEach(() => {
	app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
});

async function send<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
	const response = await app.request(`http://localhost${path}`, init);
	return { status: response.status, body: (await response.json()) as T };
}

function post(body: unknown): Promise<{ status: number; body: EnrollmentRequestItem & ErrorBody }> {
	return send('/api/enrollment-requests', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function patch(id: string, body: unknown): Promise<{ status: number; body: EnrollmentRequestItem & ErrorBody }> {
	return send(`/api/enrollment-requests/${id}/status`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('GET /api/courses regression', () => {
	it('still searches, filters, and rejects invalid course query parameters', async () => {
		const page = await send<CoursePage>('/api/courses');
		expect(page.status).toBe(200);
		expect(page.body.page).toBe(1);
		expect(page.body.pageSize).toBe(10);
		expect(page.body.totalItems).toBe(13);

		const filtered = await send<CoursePage>('/api/courses?q=security&modality=online&status=active&tag=ai');
		expect(filtered.status).toBe(200);
		expect(filtered.body.items).toEqual([
			expect.objectContaining({
				id: 'course-001',
				title: 'AI Security Foundations',
				modality: 'online',
				status: 'active',
			}),
		]);

		const invalid = await send<ErrorBody>('/api/courses?pageSize=51');
		expect(invalid.status).toBe(400);
		expect(invalid.body.error.code).toBe('INVALID_QUERY_PARAMETER');
	});
});

describe('enrollment requests', () => {
	it('creates a pending request with an opening status history entry', async () => {
		const { status, body } = await post({
			courseId: 'course-001',
			learnerEmail: ' learner@example.org ',
			justification,
		});
		expect(status).toBe(201);
		expect(body.id).toBe('enroll-001');
		expect(body.courseId).toBe('course-001');
		expect(body.learnerEmail).toBe('learner@example.org');
		expect(body.justification).toBe(justification);
		expect(body.status).toBe('pending');
		expect(body.createdAt).toBe(body.updatedAt);
		expect(body.statusHistory).toEqual([
			{
				fromStatus: null,
				toStatus: 'pending',
				changedAt: body.createdAt,
				changedBy: 'system',
				reason: null,
			},
		]);

		const stored = await send<EnrollmentRequestItem>(`/api/enrollment-requests/${body.id}`);
		expect(stored.status).toBe(200);
		expect(stored.body).toEqual(body);
	});

	it('rejects a missing, draft, or retired course', async () => {
		const missing = await post({ courseId: 'course-999', learnerEmail: 'learner@example.org', justification });
		expect(missing.status).toBe(404);
		expect(missing.body.error.code).toBe('COURSE_NOT_FOUND');

		const draft = await post({ courseId: 'course-004', learnerEmail: 'learner@example.org', justification });
		expect(draft.status).toBe(409);
		expect(draft.body.error.code).toBe('COURSE_NOT_ACTIVE');

		const retired = await post({ courseId: 'course-005', learnerEmail: 'learner@example.org', justification });
		expect(retired.status).toBe(409);
		expect(retired.body.error.code).toBe('COURSE_NOT_ACTIVE');
	});

	it('rejects an invalid email and a short justification together', async () => {
		const { status, body } = await post({
			courseId: 'course-001',
			learnerEmail: 'not-an-email',
			justification: 'too short',
		});
		expect(status).toBe(400);
		expect(body.error.code).toBe('INVALID_REQUEST');
		expect(body.error.message).toBe('The request could not be completed.');
		expect(body.error.details).toEqual([
			{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' },
			{ field: 'justification', message: 'justification must be between 20 and 500 characters.' },
		]);

		const longJustification = await post({
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification: 'a'.repeat(501),
		});
		expect(longJustification.status).toBe(400);
		expect(longJustification.body.error.details[0]?.field).toBe('justification');

		const exact = await post({
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification: 'a'.repeat(20),
		});
		expect(exact.status).toBe(201);
	});

	it('blocks a second pending or approved request and allows one after rejection or cancellation', async () => {
		const first = await post({ courseId: 'course-001', learnerEmail: 'Learner@Example.org', justification });
		const duplicatePending = await post({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		expect(duplicatePending.status).toBe(409);
		expect(duplicatePending.body.error.code).toBe('DUPLICATE_ACTIVE_REQUEST');

		const otherCourse = await post({ courseId: 'course-002', learnerEmail: 'learner@example.org', justification });
		expect(otherCourse.status).toBe(201);

		await patch(first.body.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const duplicateApproved = await post({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		expect(duplicateApproved.status).toBe(409);
		expect(duplicateApproved.body.error.code).toBe('DUPLICATE_ACTIVE_REQUEST');

		const rejected = await post({ courseId: 'course-003', learnerEmail: 'learner@example.org', justification });
		await patch(rejected.body.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Prerequisite is missing from the learner record.' });
		const afterRejection = await post({ courseId: 'course-003', learnerEmail: 'learner@example.org', justification });
		expect(afterRejection.status).toBe(201);

		await patch(otherCourse.body.id, { status: 'cancelled', changedBy: 'reviewer@example.org' });
		const afterCancellation = await post({ courseId: 'course-002', learnerEmail: 'learner@example.org', justification });
		expect(afterCancellation.status).toBe(201);
	});

	it('filters by status, courseId, and learnerEmail', async () => {
		const pending = await post({ courseId: 'course-001', learnerEmail: 'a@example.org', justification });
		const approved = await post({ courseId: 'course-002', learnerEmail: 'b@example.org', justification });
		await patch(approved.body.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const otherPending = await post({ courseId: 'course-001', learnerEmail: 'b@example.org', justification });

		const byStatus = await send<EnrollmentRequestList>('/api/enrollment-requests?status=approved');
		expect(byStatus.status).toBe(200);
		expect(byStatus.body.items.map((item) => item.id)).toEqual([approved.body.id]);

		const byCourse = await send<EnrollmentRequestList>('/api/enrollment-requests?courseId=course-001');
		expect(byCourse.body.items.map((item) => item.id)).toEqual([pending.body.id, otherPending.body.id]);

		const byEmail = await send<EnrollmentRequestList>('/api/enrollment-requests?learnerEmail=B@Example.org');
		expect(byEmail.body.items.map((item) => item.id)).toEqual([approved.body.id, otherPending.body.id]);

		const combined = await send<EnrollmentRequestList>('/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=b@example.org');
		expect(combined.body.items).toHaveLength(1);
		expect(combined.body.items[0]?.id).toBe(otherPending.body.id);

		const none = await send<EnrollmentRequestList>('/api/enrollment-requests?status=cancelled');
		expect(none.status).toBe(200);
		expect(none.body.items).toEqual([]);

		const invalid = await send<ErrorBody>('/api/enrollment-requests?status=open&extra=1');
		expect(invalid.status).toBe(400);
		expect(invalid.body.error.code).toBe('INVALID_REQUEST');
		expect(invalid.body.error.details.map((detail) => detail.field)).toEqual(['extra', 'status']);
	});

	it('applies the allowed status transitions and records each change', async () => {
		const created = await post({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		const approved = await patch(created.body.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		expect(approved.status).toBe(200);
		expect(approved.body.status).toBe('approved');
		expect(approved.body.statusHistory.map((entry) => entry.toStatus)).toEqual(['pending', 'approved']);
		expect(approved.body.statusHistory[1]).toMatchObject({
			fromStatus: 'pending',
			toStatus: 'approved',
			changedBy: 'reviewer@example.org',
			reason: null,
		});
		expect(approved.body.updatedAt).toBe(approved.body.statusHistory[1]?.changedAt);

		const cancelled = await patch(created.body.id, { status: 'cancelled', changedBy: 'learner@example.org', reason: 'Schedule conflict.' });
		expect(cancelled.status).toBe(200);
		expect(cancelled.body.status).toBe('cancelled');
		expect(cancelled.body.statusHistory).toHaveLength(3);
		expect(cancelled.body.statusHistory[2]).toMatchObject({ fromStatus: 'approved', toStatus: 'cancelled', reason: 'Schedule conflict.' });

		const pendingRejection = await post({ courseId: 'course-006', learnerEmail: 'learner@example.org', justification });
		const rejected = await patch(pendingRejection.body.id, {
			status: 'rejected',
			changedBy: 'reviewer@example.org',
			reason: 'Learner has not completed the prerequisite course.',
		});
		expect(rejected.status).toBe(200);
		expect(rejected.body.statusHistory[1]).toMatchObject({
			fromStatus: 'pending',
			toStatus: 'rejected',
			changedBy: 'reviewer@example.org',
			reason: 'Learner has not completed the prerequisite course.',
		});

		const pendingCancel = await post({ courseId: 'course-008', learnerEmail: 'learner@example.org', justification });
		const cancelledPending = await patch(pendingCancel.body.id, { status: 'cancelled', changedBy: 'learner@example.org' });
		expect(cancelledPending.status).toBe(200);
		expect(cancelledPending.body.status).toBe('cancelled');
		expect(cancelledPending.body.statusHistory[1]).toMatchObject({ fromStatus: 'pending', toStatus: 'cancelled', reason: null });
	});

	it('rejects invalid transitions, missing rejection reasons, and unknown requests', async () => {
		const created = await post({ courseId: 'course-001', learnerEmail: 'learner@example.org', justification });
		const missingReason = await patch(created.body.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: '   ' });
		expect(missingReason.status).toBe(400);
		expect(missingReason.body.error.code).toBe('INVALID_REQUEST');
		expect(missingReason.body.error.details).toEqual([{ field: 'reason', message: 'reason is required when rejecting an enrollment request.' }]);

		const stillPending = await send<EnrollmentRequestItem>(`/api/enrollment-requests/${created.body.id}`);
		expect(stillPending.body.status).toBe('pending');
		expect(stillPending.body.statusHistory).toHaveLength(1);

		await patch(created.body.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const invalid = await patch(created.body.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Too late to reject an approved request.' });
		expect(invalid.status).toBe(409);
		expect(invalid.body.error.code).toBe('INVALID_STATUS_TRANSITION');

		const unchanged = await send<EnrollmentRequestItem>(`/api/enrollment-requests/${created.body.id}`);
		expect(unchanged.body.status).toBe('approved');
		expect(unchanged.body.statusHistory).toHaveLength(2);

		const badStatus = await patch(created.body.id, { status: 'done', changedBy: 'reviewer@example.org' });
		expect(badStatus.status).toBe(400);
		expect(badStatus.body.error.details[0]?.field).toBe('status');

		const missing = await send<ErrorBody>('/api/enrollment-requests/enroll-999');
		expect(missing.status).toBe(404);
		expect(missing.body.error.code).toBe('ENROLLMENT_REQUEST_NOT_FOUND');

		const missingPatch = await patch('enroll-999', { status: 'approved', changedBy: 'reviewer@example.org' });
		expect(missingPatch.status).toBe(404);
		expect(missingPatch.body.error.code).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
	});
});
