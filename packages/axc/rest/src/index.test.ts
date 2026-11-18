import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('rest app', () => {
	it('lists courses and maps service errors to status + body', async () => {
		expect((await app.request('/api/courses')).status).toBe(200);
		const bad = await app.request('/api/courses?pageSize=99');
		expect(bad.status).toBe(400);
		expect(await bad.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'pageSize' }] } });
	});
	it('creates (201), rejects bad JSON (400) and missing request (404)', async () => {
		const body = JSON.stringify({ courseId: 'course-002', learnerEmail: 'r@e.st', justification: 'x'.repeat(25) });
		expect((await app.request('/api/enrollment-requests', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })).status).toBe(201);
		expect((await app.request('/api/enrollment-requests', { method: 'POST', body: '{bad', headers: { 'Content-Type': 'application/json' } })).status).toBe(400);
		expect((await app.request('/api/enrollment-requests/nope')).status).toBe(404);
	});
});
