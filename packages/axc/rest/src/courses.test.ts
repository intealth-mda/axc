import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('GET /api/courses', () => {
	it('returns the default page', async () => {
		const response = await app.request('http://localhost/api/courses');
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(body).toMatchObject({
			page: 1,
			pageSize: 10,
			totalItems: 15,
			totalPages: 2,
		});
		expect(body.items).toHaveLength(10);
		expect(body.items[0].id).toBe('course-012');
	});

	it('returns the documented security search', async () => {
		const response = await app.request('http://localhost/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title');

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
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

	it('filters modality, status, and tag through the query string', async () => {
		const modality = await app.request('http://localhost/api/courses?modality=online&pageSize=50');
		const status = await app.request('http://localhost/api/courses?status=active&pageSize=50');
		const tag = await app.request('http://localhost/api/courses?tag=AI&pageSize=50');

		expect((await modality.json()).items.every((item: { modality: string }) => item.modality === 'online')).toBe(true);
		expect((await status.json()).items.every((item: { status: string }) => item.status === 'active')).toBe(true);
		expect((await tag.json()).items.map((item: { id: string }) => item.id)).toEqual(['course-001', 'course-008', 'course-009']);
	});

	it('sorts by createdAt and paginates', async () => {
		const sorted = await app.request('http://localhost/api/courses?sort=createdAt&pageSize=3');
		const body = await sorted.json();

		expect(body.items.map((item: { id: string }) => item.id)).toEqual(['course-004', 'course-001', 'course-007']);
		expect(body.pageSize).toBe(3);
		expect(body.totalItems).toBe(15);
		expect(body.totalPages).toBe(5);
	});

	it('returns an empty list when nothing matches', async () => {
		const response = await app.request('http://localhost/api/courses?q=zzznomatchxyz');

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});

	it('returns the shared error body for invalid query parameters', async () => {
		const response = await app.request('http://localhost/api/courses?modality=remote&pageSize=51&sort=name&page=0');

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [
					{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' },
					{ field: 'page', message: 'page must be an integer greater than or equal to 1.' },
					{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' },
					{ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' },
				],
			},
		});
	});
});

describe('GET /health', () => {
	it('still returns the health contract', async () => {
		const response = await app.request('http://localhost/health');
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.status).toBe('ok');
		expect(body.service).toBe('agentCourses-api');
		expect(body.projectCode).toBe('axc');
		expect(body.environment).toBe('test');
	});
});
