import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('rest', () => {
	it('maps errors and statuses', async () => {
		expect((await app.request('/api/courses?pageSize=99')).status).toBe(400);
		expect((await app.request('/api/enrollment-requests/nope')).status).toBe(404);
		const bad = await app.request('/api/enrollment-requests', { method: 'POST', body: '{bad', headers: { 'Content-Type': 'application/json' } });
		expect(bad.status).toBe(400);
		const ok = await app.request('/api/enrollment-requests', { method: 'POST', body: JSON.stringify({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(20) }) });
		expect(ok.status).toBe(201);
		expect((await app.request('/health')).status).toBe(200);
	});
});
