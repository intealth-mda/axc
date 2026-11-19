import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';

describe('enrollment request routes', () => {
	it('creates, fetches, lists, and updates a request', async () => {
		const app = createApp();

		const created = await app.request('http://localhost/api/enrollment-requests', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ courseId: 'course-001', learnerEmail: 'route@example.org', justification: JUSTIFICATION }),
		});
		const createdBody = await created.json();
		const fetched = await app.request(`http://localhost/api/enrollment-requests/${createdBody.id}`);
		const listed = await app.request('http://localhost/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=route@example.org');
		const approved = await app.request(`http://localhost/api/enrollment-requests/${createdBody.id}/status`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ status: 'approved', changedBy: 'reviewer@example.org' }),
		});

		expect(created.status).toBe(201);
		expect(createdBody.status).toBe('pending');
		expect(createdBody.statusHistory).toHaveLength(1);
		expect(fetched.status).toBe(200);
		expect(await fetched.json()).toMatchObject({ id: createdBody.id, statusHistory: [{ fromStatus: null, toStatus: 'pending', changedBy: 'system' }] });
		expect(listed.status).toBe(200);
		expect(await listed.json()).toMatchObject({ items: [{ id: createdBody.id }] });
		expect(approved.status).toBe(200);
		expect(await approved.json()).toMatchObject({
			status: 'approved',
			statusHistory: [{ toStatus: 'pending' }, { fromStatus: 'pending', toStatus: 'approved', changedBy: 'reviewer@example.org' }],
		});
	});

	it('returns the documented error statuses', async () => {
		const app = createApp();
		await post(app, { courseId: 'course-001', learnerEmail: 'dup@example.org', justification: JUSTIFICATION });

		const missingCourse = await post(app, { courseId: 'course-999', learnerEmail: 'missing@example.org', justification: JUSTIFICATION });
		const draftCourse = await post(app, { courseId: 'course-003', learnerEmail: 'draft@example.org', justification: JUSTIFICATION });
		const badEmail = await post(app, { courseId: 'course-001', learnerEmail: 'not-an-email', justification: JUSTIFICATION });
		const shortJustification = await post(app, { courseId: 'course-001', learnerEmail: 'short@example.org', justification: 'too short' });
		const duplicate = await post(app, { courseId: 'course-001', learnerEmail: 'dup@example.org', justification: JUSTIFICATION });
		const missingRequest = await app.request('http://localhost/api/enrollment-requests/enroll-404');
		const badStatus = await patch(app, 'enroll-001', { status: 'done', changedBy: 'reviewer@example.org' });
		const missingReason = await patch(app, 'enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org' });
		await patch(app, 'enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' });
		const badTransition = await patch(app, 'enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Too late.' });
		const courses = await app.request('http://localhost/api/courses?q=security&modality=online&status=active&tag=ai');

		expect(missingCourse.status).toBe(404);
		expect(await missingCourse.json()).toMatchObject({ error: { code: 'COURSE_NOT_FOUND' } });
		expect(draftCourse.status).toBe(409);
		expect(await draftCourse.json()).toMatchObject({ error: { code: 'COURSE_NOT_ACTIVE' } });
		expect(badEmail.status).toBe(400);
		expect(await badEmail.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });
		expect(shortJustification.status).toBe(400);
		expect(duplicate.status).toBe(409);
		expect(await duplicate.json()).toMatchObject({ error: { code: 'DUPLICATE_ACTIVE_REQUEST' } });
		expect(missingRequest.status).toBe(404);
		expect(await missingRequest.json()).toMatchObject({ error: { code: 'ENROLLMENT_REQUEST_NOT_FOUND' } });
		expect(badStatus.status).toBe(400);
		expect(missingReason.status).toBe(400);
		expect(badTransition.status).toBe(409);
		expect(await badTransition.json()).toMatchObject({ error: { code: 'INVALID_STATUS_TRANSITION' } });
		expect(courses.status).toBe(200);
		expect(await courses.json()).toMatchObject({ items: [{ id: 'course-001' }] });
	});

	it('returns 400 for a body that is not JSON', async () => {
		const app = createApp();
		const response = await app.request('http://localhost/api/enrollment-requests', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{',
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: { code: 'INVALID_REQUEST', details: [{ field: 'body' }] } });
	});
});

function createApp() {
	return createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
}

function post(app: ReturnType<typeof createApp>, body: { courseId: string; learnerEmail: string; justification: string }) {
	return app.request('http://localhost/api/enrollment-requests', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function patch(app: ReturnType<typeof createApp>, id: string, body: { status: string; changedBy: string; reason?: string }) {
	return app.request(`http://localhost/api/enrollment-requests/${id}/status`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}
