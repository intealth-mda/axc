import { buildApplicationServicesFactory } from '@axc/application-services';
import { createFixtureDataSourcesFactory } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createRestApp } from '../index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test', dataSourcesFactory: createFixtureDataSourcesFactory() }));
describe('courses HTTP contract', () => {
	it('returns defaults and complete DTO fields', async () => {
		const response = await app.request('/api/courses');
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(body.items).toHaveLength(10);
		expect(body.items[0]).toEqual({
			id: 'course-001',
			title: 'AI Security Foundations',
			summary: 'Secure AI-assisted development.',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'security'],
			createdAt: '2026-12-01T00:00:00.000Z',
			updatedAt: '2027-01-01T00:00:00.000Z',
		});
	});
	it.each([
		'modality=bad',
		'status=bad',
		'page=0',
		'page=-1',
		'page=1.5',
		'page=',
		'page=1e2',
		'page=9007199254740992',
		'pageSize=0',
		'pageSize=51',
		'pageSize=abc',
		'sort=bad',
		'sort=',
		'tag=ai&tag=web',
		'page=1&page=2',
		'unknown=x',
		'__proto__=x',
	])('rejects %s consistently', async (query) => {
		const response = await app.request(`/api/courses?${query}`);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: expect.arrayContaining([{ field: query.split('=')[0], message: expect.any(String) }]) },
		});
	});
	it('isolates returned tags between requests', async () => {
		const first = await (await app.request('/api/courses')).json();
		first.items[0].tags.push('changed');
		const second = await (await app.request('/api/courses')).json();
		expect(second.items[0].tags).toEqual(['ai', 'security']);
	});
	it('accepts boundary pagination and empty matches', async () => {
		const response = await app.request('/api/courses?pageSize=50&q=unmatched');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 });
	});
});
