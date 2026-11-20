import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('rest', () => {
	it('maps service errors to status and body', async () => {
		const bad = await app.request('/api/courses?pageSize=99');
		expect(bad.status).toBe(400);
		expect(((await bad.json()) as { error: { code: string } }).error.code).toBe('INVALID_QUERY_PARAMETER');
		expect((await app.request('/api/enrollment-requests/nope')).status).toBe(404);
		expect((await app.request('/api/enrollment-requests', { method: 'POST', body: '{bad', headers: { 'Content-Type': 'application/json' } })).status).toBe(400);
		const ok = await app.request('/api/enrollment-requests', { method: 'POST', body: JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@x.org', justification: 'x'.repeat(25) }) });
		expect(ok.status).toBe(201);
	});
});
