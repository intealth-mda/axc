import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('rest app', () => {
	it('maps service errors to status and error body', async () => {
		const res = await app.request('/api/courses?pageSize=99');
		expect(res.status).toBe(400);
		expect(((await res.json()) as { error: { code: string } }).error.code).toBe('INVALID_QUERY_PARAMETER');
		const bad = await app.request('/api/enrollment-requests', { method: 'POST', body: '{bad', headers: { 'Content-Type': 'application/json' } });
		expect(bad.status).toBe(400);
		expect((await app.request('/api/enrollment-requests/nope')).status).toBe(404);
	});
	it('creates with 201', async () => {
		const res = await app.request('/api/enrollment-requests', {
			method: 'POST',
			body: JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@example.org', justification: 'x'.repeat(30) }),
			headers: { 'Content-Type': 'application/json' },
		});
		expect(res.status).toBe(201);
	});
});
