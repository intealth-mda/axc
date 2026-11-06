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

	it('returns 200 with the default first page and pagination metadata', async () => {
		const res = await app().request('/api/courses');

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ items: expect.any(Array), page: 1, pageSize: 10, totalItems: 14, totalPages: 2 });
		expect(body.items).toHaveLength(10);
		expect(body.items[0]).toEqual({
			id: 'course-012',
			title: 'Accessible Web Design',
			summary: 'Build interfaces that work for every user.',
			modality: 'online',
			status: 'retired',
			tags: ['accessibility', 'web'],
			createdAt: '2024-08-05T00:00:00.000Z',
			updatedAt: '2025-03-28T00:00:00.000Z',
		});
	});

	it('returns 200 with only the courses matching q, modality and status', async () => {
		const res = await app().request('/api/courses?q=security&modality=online&status=active');

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.items.map((c: { id: string }) => c.id)).toEqual(['course-001', 'course-005']);
		expect(body).toMatchObject({ page: 1, pageSize: 10, totalItems: 2, totalPages: 1 });
	});

	it('returns the documented example response for the documented example request', async () => {
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

	it('returns 400 with the error contract when pageSize exceeds 50', async () => {
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

	it('returns 400 with the page error when page is too large to be a safe integer', async () => {
		const res = await app().request(`/api/courses?page=${'9'.repeat(400)}`);

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'page', message: 'page must be a positive integer.' }],
			},
		});
	});

	it('returns 400 listing every invalid parameter', async () => {
		const res = await app().request('/api/courses?modality=remote&sort=price');

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error.details).toEqual([
			{ field: 'modality', message: 'modality must be one of: online, in-person, hybrid.' },
			{ field: 'sort', message: 'sort must be one of: title, createdAt, updatedAt.' },
		]);
	});

	it('returns 200 with empty items and zero totals when nothing matches', async () => {
		const res = await app().request('/api/courses?q=no-such-course-xyz');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	});

	it('calls forRequest with no argument when the Authorization header is absent', async () => {
		const factory = spyFactory();

		const res = await createRestApp(factory).request('/api/courses');

		expect(res.status).toBe(200);
		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith();
	});

	it('passes the Authorization header to forRequest when it is present', async () => {
		const factory = spyFactory();

		const res = await createRestApp(factory).request('/api/courses', { headers: { Authorization: 'Bearer abc' } });

		expect(res.status).toBe(200);
		expect(factory.forRequest).toHaveBeenCalledTimes(1);
		expect(factory.forRequest).toHaveBeenCalledWith('Bearer abc');
	});
});
