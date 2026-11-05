import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('rest app', () => {
	it('serves courses and maps service errors to status codes', async () => {
		expect((await app.request('/api/courses')).status).toBe(200);
		const bad = await app.request('/api/courses?pageSize=99');
		expect(bad.status).toBe(400);
		expect(await bad.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'pageSize' }] } });
		expect((await app.request('/api/enrollment-requests/missing')).status).toBe(404);
	});

	it('creates with 201 and treats invalid JSON as 400', async () => {
		const ok = await app.request('/api/enrollment-requests', { method: 'POST', body: JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@example.org', justification: 'x'.repeat(20) }) });
		expect(ok.status).toBe(201);
		expect((await app.request('/api/enrollment-requests', { method: 'POST', body: '{' })).status).toBe(400);
	});
});
