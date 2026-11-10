import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = () => createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const post = (body: string) => ({ method: 'POST', body, headers: { 'Content-Type': 'application/json' } });

describe('rest app', () => {
	it('routes courses and maps service errors to status', async () => {
		const a = app();
		expect((await a.request('/api/courses')).status).toBe(200);
		const bad = await a.request('/api/courses?pageSize=99');
		expect(bad.status).toBe(400);
		expect(await bad.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'pageSize' }] } });
	});
	it('creates with 201, 404s unknown ids and 400s invalid JSON', async () => {
		const a = app();
		const res = await a.request('/api/enrollment-requests', post(JSON.stringify({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(25) })));
		expect(res.status).toBe(201);
		const { id } = (await res.json()) as { id: string };
		expect((await a.request(`/api/enrollment-requests/${id}`)).status).toBe(200);
		expect((await a.request('/api/enrollment-requests/nope')).status).toBe(404);
		expect((await a.request('/api/enrollment-requests', post('{'))).status).toBe(400);
		expect((await a.request(`/api/enrollment-requests/${id}/status`, { ...post('{"status":"approved","changedBy":"r"}'), method: 'PATCH' })).status).toBe(200);
	});
});
