import { Domain } from '@axc/domain';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../test-support.ts';

describe('GET /api/courses', () => {
	it('parses defaults and every filter, paging and sort field', async () => {
		const f = fixture();
		const search = vi.mocked(f.services.Training.Course.queryCourses);
		expect((await f.app.request('/api/courses')).status).toBe(200);
		expect(search).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, sort: 'title' });
		const response = await f.app.request('/api/courses?q=Security&modality=online&status=active&tag=AI&page=2&pageSize=5&sort=updatedAt');
		expect(await response.json()).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		expect(search).toHaveBeenLastCalledWith({ q: 'Security', modality: 'online', status: 'active', tag: 'AI', page: 2, pageSize: 5, sort: 'updatedAt' });
	});
	it.each(['0', '-1', '1.5', '1e2', 'Infinity', '', '99999999999999999999'])('rejects invalid page %s through domain validation', async (value) => {
		const f = fixture();
		vi.mocked(f.services.Training.Course.queryCourses).mockImplementation((query) => {
			Domain.Contexts.Training.Course.assertCourseSearch(query);
			return Promise.resolve({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		});
		const res = await f.app.request(`/api/courses?page=${value}`);
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'page' }] } });
	});
	it.each([
		'modality=remote',
		'modality=',
		'status=unknown',
		'status=',
		'sort=descending',
		'sort=',
		'pageSize=0',
		'pageSize=51',
		'pageSize=',
		'pageSize=99999999999999999999',
		'q=',
		'tag=',
	])('returns consistent validation errors for %s', async (query) => {
		const f = fixture();
		vi.mocked(f.services.Training.Course.queryCourses).mockImplementation((input) => {
			Domain.Contexts.Training.Course.assertCourseSearch(input);
			return Promise.resolve({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		});
		const res = await f.app.request(`/api/courses?${query}`);
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.' } });
	});
	it('preserves health and passes authorization through the factory', async () => {
		const f = fixture();
		const res = await f.app.request('/health');
		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({ status: 'ok', projectCode: 'axc' });
		await f.app.request('/api/courses', { headers: { Authorization: 'sample' } });
		expect(f.factory.forRequest).toHaveBeenLastCalledWith('sample');
	});
});
