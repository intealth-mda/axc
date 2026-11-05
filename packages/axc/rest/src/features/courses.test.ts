import type { ApplicationServicesFactory } from '@axc/application-services';
import type { Domain } from '@axc/domain';
import { describe, expect, it, vi } from 'vitest';
import { createRestApp } from '../index.ts';

const queryCourses = vi.fn(async (query: Domain.Contexts.Catalog.Course.CourseSearchQuery) => ({ items: [], page: query.page, pageSize: query.pageSize, totalItems: 0, totalPages: 0 }));
const factory: ApplicationServicesFactory = {
	forRequest: async () => ({ Catalog: { Course: { queryCourses } }, health: { getStatus: () => ({ status: 'ok', service: 'agentCourses-api', projectCode: 'axc', environment: 'test', timestamp: '2026-01-01T00:00:00.000Z' }) } }),
};
const app = createRestApp(factory);
describe('GET /api/courses', () => {
	it('A-AC1 parses defaults and returns the service result', async () => {
		const response = await app.request('/api/courses');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		expect(queryCourses).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, sort: 'title' });
	});
	it('parses all filters and pagination', async () => {
		const response = await app.request('/api/courses?q=security&modality=online&status=active&tag=AI&page=2&pageSize=5&sort=updatedAt');
		expect(response.status).toBe(200);
		expect(queryCourses).toHaveBeenLastCalledWith({ q: 'security', modality: 'online', status: 'active', tag: 'AI', page: 2, pageSize: 5, sort: 'updatedAt' });
	});
	it.each([
		'modality=bad',
		'status=bad',
		'sort=bad',
		'page=0',
		'page=-1',
		'page=1.5',
		'page=1e2',
		'page=99999999999999999999',
		'pageSize=0',
		'pageSize=51',
		'pageSize=NaN',
		'pageSize=1.5',
		'pageSize=99999999999999999999',
		'page=',
		'pageSize=',
		'q=',
		'q=%20',
		'tag=',
		'modality=',
		'status=',
		'sort=',
		'unknown=x',
		'page=1&page=2',
	])('A-AC8 rejects %s', async (params) => {
		queryCourses.mockClear();
		const response = await app.request(`/api/courses?${params}`);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: expect.arrayContaining([expect.objectContaining({ field: params.split('=')[0], message: expect.any(String) })]) },
		});
		expect(queryCourses).not.toHaveBeenCalled();
	});
	it('collects every validation problem', async () => {
		const response = await app.request('/api/courses?modality=bad&status=bad&page=0&pageSize=51&sort=bad');
		expect(await response.json()).toMatchObject({ error: { details: expect.arrayContaining(['modality', 'status', 'page', 'pageSize', 'sort'].map((field) => ({ field, message: expect.any(String) }))) } });
	});
	it('accepts maximum pageSize and safe large pages', async () => {
		expect((await app.request('/api/courses?pageSize=50&page=9007199254740991')).status).toBe(200);
	});
	it('preserves the health route', async () => {
		expect((await app.request('/health')).status).toBe(200);
	});
});
