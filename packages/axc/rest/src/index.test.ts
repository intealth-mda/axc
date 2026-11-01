import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@axc/application-services';
import type { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createRestApp } from './index.ts';

function spyFactory(): ApplicationServicesFactory {
	const factory = buildApplicationServicesFactory({ environment: 'test' });
	vi.spyOn(factory, 'forRequest');
	return factory;
}

describe('createRestApp', () => {
	it('GET /health returns 200 with the health contract for the configured environment', async () => {
		const res = await createRestApp(buildApplicationServicesFactory({ environment: 'test' })).request('/health');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			status: 'ok',
			service: 'agentCourses-api',
			projectCode: 'axc',
			environment: 'test',
			timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
		});
	});

	it('GET /health/ with a trailing slash returns 200', async () => {
		const res = await createRestApp(buildApplicationServicesFactory({ environment: 'test' })).request('/health/');

		expect(res.status).toBe(200);
	});

	it('calls forRequest with no argument when the Authorization header is absent', async () => {
		const factory = spyFactory();

		await createRestApp(factory).request('/health');

		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith();
	});

	it('passes the Authorization header to forRequest when it is present', async () => {
		const factory = spyFactory();

		const res = await createRestApp(factory).request('/health', { headers: { Authorization: 'Bearer abc' } });

		expect(res.status).toBe(200);
		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith('Bearer abc');
	});
});

describe('GET /api/courses', () => {
	const app = () => createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

	it('returns 200 with the CoursePage JSON for the API contract example', async () => {
		const res = await app().request('/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			items: [
				{
					id: 'course-001',
					title: 'AI Security Foundations',
					summary: 'Introductory course on secure AI-assisted development.',
					modality: 'online',
					status: 'active',
					tags: ['ai', 'security'],
					createdAt: '2026-01-15T00:00:00.000Z',
					updatedAt: '2026-06-01T00:00:00.000Z',
				},
			],
			page: 1,
			pageSize: 5,
			totalItems: 1,
			totalPages: 1,
		});
	});

	it('returns 200 with default pagination when no query is given', async () => {
		const res = await app().request('/api/courses');

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({ page: 1, pageSize: 10, totalItems: 14, totalPages: 2 });
		expect(body.items).toHaveLength(10);
	});

	it('ignores unknown query parameters', async () => {
		const res = await app().request('/api/courses?foo=bar');

		expect(res.status).toBe(200);
	});

	it('returns 400 with the INVALID_QUERY_PARAMETER envelope for an invalid pageSize', async () => {
		const res = await app().request('/api/courses?pageSize=51');

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
			},
		});
	});

	it('returns 400 with one detail per invalid field', async () => {
		const res = await app().request('/api/courses?modality=remote&status=archived&page=0&sort=priority');

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(body.error.message).toBe('One or more query parameters are invalid.');
		expect(body.error.details.map((detail: { field: string }) => detail.field).sort()).toEqual(['modality', 'page', 'sort', 'status']);
	});

	it('returns 200 with an empty items array when nothing matches', async () => {
		const res = await app().request('/api/courses?q=no-such-course-xyz');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});

	it('passes the Authorization header to forRequest', async () => {
		const factory = spyFactory();

		await createRestApp(factory).request('/api/courses', { headers: { Authorization: 'Bearer abc' } });

		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith('Bearer abc');
	});

	it('treats a trailing slash like the canonical path', async () => {
		const res = await app().request('/api/courses/?q=security');
		const canonical = await app().request('/api/courses?q=security');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(await canonical.json());
	});

	it('calls forRequest with no argument when the Authorization header is absent', async () => {
		const factory = spyFactory();

		await createRestApp(factory).request('/api/courses');

		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith();
	});
});

describe('enrollment request routes', () => {
	const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';
	const validBody = { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: JUSTIFICATION };
	const ISO = expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

	// One app per test: the factory holds the in-memory store, so state is shared across requests to the same app.
	const app = () => createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
	const json = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
	const create = (target: Hono, body: unknown = validBody) => target.request('/api/enrollment-requests', json('POST', body));
	const patch = (target: Hono, id: string, body: unknown) => target.request(`/api/enrollment-requests/${id}/status`, json('PATCH', body));

	async function expectError(res: Response, status: number, code: string) {
		expect(res.status).toBe(status);
		const body = await res.json();
		expect(body).toEqual({ error: { code, message: expect.any(String), details: expect.any(Array) } });
		return body.error as { code: string; message: string; details: { field: string; message: string }[] };
	}

	describe('POST /api/enrollment-requests', () => {
		it('returns 201 with the new pending request', async () => {
			const res = await create(app());

			expect(res.status).toBe(201);
			expect(await res.json()).toEqual({
				id: 'enroll-001',
				...validBody,
				status: 'pending',
				createdAt: ISO,
				updatedAt: ISO,
				statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: ISO, changedBy: 'system', reason: null }],
			});
		});

		it('returns 400 INVALID_REQUEST with the documented envelope for a short justification', async () => {
			const res = await create(app(), { ...validBody, justification: 'too short' });

			expect(res.status).toBe(400);
			expect(await res.json()).toEqual({
				error: {
					code: 'INVALID_REQUEST',
					message: 'The request could not be completed.',
					details: [{ field: 'justification', message: 'justification must be between 20 and 500 characters.' }],
				},
			});
		});

		it('returns 400 INVALID_REQUEST for an invalid email', async () => {
			const error = await expectError(await create(app(), { ...validBody, learnerEmail: 'not-an-email' }), 400, 'INVALID_REQUEST');

			expect(error.details.map((detail) => detail.field)).toEqual(['learnerEmail']);
		});

		it('returns 400 INVALID_REQUEST for invalid JSON', async () => {
			const res = await app().request('/api/enrollment-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"courseId":' });

			await expectError(res, 400, 'INVALID_REQUEST');
		});

		it('returns 400 INVALID_REQUEST when the body is missing', async () => {
			await expectError(await app().request('/api/enrollment-requests', { method: 'POST' }), 400, 'INVALID_REQUEST');
		});

		it('returns 400 INVALID_REQUEST when the body is not an object', async () => {
			await expectError(await create(app(), 'course-001'), 400, 'INVALID_REQUEST');
		});

		it('returns 404 COURSE_NOT_FOUND with empty details for a missing course', async () => {
			const error = await expectError(await create(app(), { ...validBody, courseId: 'course-999' }), 404, 'COURSE_NOT_FOUND');

			expect(error.details).toEqual([]);
		});

		it.each(['course-004', 'course-005'])('returns 409 COURSE_NOT_ACTIVE for the inactive course %s', async (courseId) => {
			await expectError(await create(app(), { ...validBody, courseId }), 409, 'COURSE_NOT_ACTIVE');
		});

		it('returns 409 DUPLICATE_ACTIVE_REQUEST for a second pending request', async () => {
			const target = app();
			await create(target);

			await expectError(await create(target), 409, 'DUPLICATE_ACTIVE_REQUEST');
		});

		it('passes the Authorization header to forRequest', async () => {
			const factory = spyFactory();

			const res = await createRestApp(factory).request('/api/enrollment-requests', { ...json('POST', validBody), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer abc' } });

			expect(res.status).toBe(201);
			expect(factory.forRequest).toHaveBeenCalledWith('Bearer abc');
		});
	});

	describe('GET /api/enrollment-requests/:id', () => {
		it('returns 200 with the request including its status history', async () => {
			const target = app();
			const createdRes = await create(target);
			expect(createdRes.status).toBe(201);
			const created = await createdRes.json();

			const res = await target.request('/api/enrollment-requests/enroll-001');

			expect(res.status).toBe(200);
			expect(await res.json()).toEqual(created);
		});

		it('returns 404 ENROLLMENT_REQUEST_NOT_FOUND for an unknown id', async () => {
			const error = await expectError(await app().request('/api/enrollment-requests/enroll-999'), 404, 'ENROLLMENT_REQUEST_NOT_FOUND');

			expect(error.details).toEqual([]);
		});
	});

	describe('GET /api/enrollment-requests', () => {
		it('returns 200 with an empty items array when there are no requests', async () => {
			const res = await app().request('/api/enrollment-requests');

			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({ items: [] });
		});

		it('returns 200 with items filtered by status, courseId, and learnerEmail', async () => {
			const target = app();
			await create(target);
			await create(target, { ...validBody, courseId: 'course-002' });
			await create(target, { ...validBody, learnerEmail: 'other@example.org' });

			const res = await target.request('/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=LEARNER@example.org');

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.items.map((item: { id: string }) => item.id)).toEqual(['enroll-001']);
		});

		it('returns 400 INVALID_REQUEST for an invalid status filter', async () => {
			const error = await expectError(await app().request('/api/enrollment-requests?status=archived'), 400, 'INVALID_REQUEST');

			expect(error.details.map((detail) => detail.field)).toEqual(['status']);
		});
	});

	describe('PATCH /api/enrollment-requests/:id/status', () => {
		it('returns 200 with the approved request and an appended history entry', async () => {
			const target = app();
			await create(target);

			const res = await patch(target, 'enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' });

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.status).toBe('approved');
			expect(body.statusHistory).toEqual([
				{ fromStatus: null, toStatus: 'pending', changedAt: ISO, changedBy: 'system', reason: null },
				{ fromStatus: 'pending', toStatus: 'approved', changedAt: ISO, changedBy: 'reviewer@example.org', reason: null },
			]);
		});

		it('persists the change for a later GET', async () => {
			const target = app();
			await create(target);
			await patch(target, 'enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Learner has not completed the prerequisite course.' });

			const res = await target.request('/api/enrollment-requests/enroll-001');

			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.status).toBe('rejected');
			expect(body.statusHistory).toHaveLength(2);
		});

		it('returns 409 INVALID_STATUS_TRANSITION for approved -> rejected', async () => {
			const target = app();
			await create(target);
			await patch(target, 'enroll-001', { status: 'approved', changedBy: 'reviewer@example.org' });

			const error = await expectError(await patch(target, 'enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Changed our minds.' }), 409, 'INVALID_STATUS_TRANSITION');

			expect(error.details).toEqual([]);
		});

		it('returns 400 INVALID_REQUEST when rejecting without a reason', async () => {
			const target = app();
			await create(target);

			const error = await expectError(await patch(target, 'enroll-001', { status: 'rejected', changedBy: 'reviewer@example.org' }), 400, 'INVALID_REQUEST');

			expect(error.details.map((detail) => detail.field)).toEqual(['reason']);
		});

		it('returns 400 INVALID_REQUEST for an unknown status value', async () => {
			const target = app();
			await create(target);

			await expectError(await patch(target, 'enroll-001', { status: 'archived', changedBy: 'reviewer@example.org' }), 400, 'INVALID_REQUEST');
		});

		it('returns 400 INVALID_REQUEST for invalid JSON', async () => {
			const target = app();
			await create(target);

			const res = await target.request('/api/enrollment-requests/enroll-001/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: 'nope' });

			await expectError(res, 400, 'INVALID_REQUEST');
		});

		it('returns 404 ENROLLMENT_REQUEST_NOT_FOUND for an unknown id', async () => {
			await expectError(await patch(app(), 'enroll-999', { status: 'approved', changedBy: 'reviewer@example.org' }), 404, 'ENROLLMENT_REQUEST_NOT_FOUND');
		});
	});
});
