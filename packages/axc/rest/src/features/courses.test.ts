import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import { describe, expect, it, vi } from 'vitest';
import { createRestApp } from '../index.ts';

const courseDomain = Domain.Contexts.Catalog.Course;
function setup() {
	const queryCourses = vi.fn(async (query: Domain.Contexts.Catalog.Course.CourseSearchQuery) => {
		courseDomain.assertCourseSearch(query);
		return await Promise.resolve({ items: [], page: query.page, pageSize: query.pageSize, totalItems: 0, totalPages: 0 });
	});
	const forRequest = vi.fn(async () => ({ Catalog: { Course: { queryCourses } } }));
	const app = createRestApp({ forRequest } as unknown as ApplicationServicesFactory);
	return { app, queryCourses, forRequest };
}
describe('GET /api/courses', () => {
	it('parses defaults and returns the page contract', async () => {
		const { app, queryCourses } = setup();
		const response = await app.request('/api/courses');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		expect(queryCourses).toHaveBeenCalledWith({ page: 1, pageSize: 10, sort: 'title' });
	});
	it('parses every supported field and forwards authorization', async () => {
		const { app, queryCourses, forRequest } = setup();
		const response = await app.request('/api/courses?q=Security&modality=online&status=active&tag=AI&page=2&pageSize=50&sort=updatedAt', { headers: { Authorization: 'test' } });
		expect(response.status).toBe(200);
		expect(forRequest).toHaveBeenCalledWith('test');
		expect(queryCourses).toHaveBeenCalledWith({ q: 'Security', modality: 'online', status: 'active', tag: 'AI', page: 2, pageSize: 50, sort: 'updatedAt' });
	});
	it.each([
		'modality=remote',
		'modality=',
		'status=bad',
		'status=',
		'sort=bad',
		'sort=',
		'page=0',
		'page=-1',
		'page=1.5',
		'page=1e2',
		'page=',
		'page=abc',
		'page=9007199254740992',
		'pageSize=0',
		'pageSize=51',
		'pageSize=1.5',
		'pageSize=',
		'pageSize=99999999999999999999',
		'q=',
		'tag=',
		'q=%20',
		'tag=%20',
	])('rejects %s consistently', async (query) => {
		const response = await setup().app.request(`/api/courses?${query}`);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: [{ field: query.split('=')[0], message: expect.any(String) }] } });
	});
	it('reports all invalid fields together', async () => {
		const response = await setup().app.request('/api/courses?page=0&pageSize=51&sort=bad');
		const body = await response.json();
		expect(response.status).toBe(400);
		expect(body.error.details.map((d: { field: string }) => d.field).sort()).toEqual(['page', 'pageSize', 'sort']);
	});
	it('lets unexpected failures reach the server error handler', async () => {
		const { app, queryCourses } = setup();
		queryCourses.mockRejectedValueOnce(new Error('unexpected'));
		expect((await app.request('/api/courses')).status).toBe(500);
	});
});
