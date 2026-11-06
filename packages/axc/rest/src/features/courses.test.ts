import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import { describe, expect, it, vi } from 'vitest';
import { createRestApp } from '../index.ts';

const page = { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 };
const setup = () => {
	const queryCourses = vi.fn((query) => {
		Domain.Contexts.Catalog.Course.assertCourseSearch(query);
		return Promise.resolve(page);
	});
	const forRequest = vi.fn(() => Promise.resolve({ Catalog: { Course: { queryCourses } }, health: { getStatus: vi.fn() } }));
	return { app: createRestApp({ forRequest } satisfies ApplicationServicesFactory), queryCourses, forRequest };
};
describe('GET /api/courses', () => {
	it('returns the page and parses defaults', async () => {
		const { app, queryCourses } = setup();
		const response = await app.request('/api/courses');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(page);
		expect(queryCourses.mock.calls[0]?.[0]).toMatchObject({ page: 1, pageSize: 10, sort: 'title' });
	});
	it('parses all filters and forwards authorization', async () => {
		const { app, queryCourses, forRequest } = setup();
		await app.request('/api/courses?q=SECURITY&modality=online&status=active&tag=AI&page=2&pageSize=5&sort=updatedAt', { headers: { Authorization: 'sample' } });
		expect(queryCourses.mock.calls[0]?.[0]).toEqual({ q: 'SECURITY', modality: 'online', status: 'active', tag: 'AI', page: 2, pageSize: 5, sort: 'updatedAt', invalidFields: [] });
		expect(forRequest).toHaveBeenCalledWith('sample');
	});
	it.each([
		'modality=other',
		'status=other',
		'sort=other',
		'page=0',
		'page=-1',
		'page=1.5',
		'page=1e2',
		'page=',
		'page=9007199254740992',
		'pageSize=0',
		'pageSize=51',
		'pageSize=NaN',
		'q=',
		'tag=%20',
		'modality=',
		'status=',
		'sort=',
		'pageSize=',
		'unknown=1',
		'page=1&page=2',
	])('rejects %s consistently', async (query) => {
		const { app } = setup();
		const response = await app.request(`/api/courses?${query}`);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toEqual({ error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: expect.arrayContaining([{ field: expect.any(String), message: expect.any(String) }]) } });
	});
	it('reports all validation problems together', async () => {
		const { app } = setup();
		const response = await app.request('/api/courses?page=0&pageSize=99&sort=bad');
		expect((await response.json()).error.details.map((detail: { field: string }) => detail.field)).toEqual(['sort', 'page', 'pageSize']);
	});
	it('leaves unexpected failures to the server error handler', async () => {
		const { app, queryCourses } = setup();
		queryCourses.mockImplementation(() => {
			throw new Error('unexpected');
		});
		expect((await app.request('/api/courses')).status).toBe(500);
	});
});
