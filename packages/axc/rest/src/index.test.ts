import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@axc/application-services';
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
