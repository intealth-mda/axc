import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const post = (path: string, body: string) => app.request(path, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });

describe('rest app', () => {
	it('serves health and course search', async () => {
		expect((await app.request('/health')).status).toBe(200);
		expect((await app.request('/api/courses?pageSize=2')).status).toBe(200);
	});

	it('maps service errors to status + error body', async () => {
		const res = await app.request('/api/courses?sort=bad');
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'sort' }] } });
		expect((await post('/api/enrollment-requests', '{bad')).status).toBe(400);
		expect((await app.request('/api/enrollment-requests/none')).status).toBe(404);
	});

	it('creates (201), patches, and lists', async () => {
		const created = await post('/api/enrollment-requests', JSON.stringify({ courseId: 'course-002', learnerEmail: 'r@x.org', justification: 'x'.repeat(30) }));
		expect(created.status).toBe(201);
		const { id } = (await created.json()) as { id: string };
		const patched = await app.request(`/api/enrollment-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', changedBy: 'r' }) });
		expect(patched.status).toBe(200);
		expect((await post('/api/enrollment-requests', JSON.stringify({ courseId: 'course-002', learnerEmail: 'r@x.org', justification: 'x'.repeat(30) }))).status).toBe(201);
		expect((await app.request('/api/enrollment-requests?learnerEmail=r@x.org')).status).toBe(200);
		expect((await app.request(`/api/enrollment-requests/${id}/status`, { method: 'PATCH', body: '{}' })).status).toBe(400);
	});
});
