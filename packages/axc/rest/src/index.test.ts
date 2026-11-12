import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const post = (body: string) => app.request('/api/enrollment-requests', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });

describe('rest', () => {
	it('creates 201 and maps errors to status', async () => {
		expect((await post(JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@b.co', justification: 'x'.repeat(30) }))).status).toBe(201);
		const bad = await post('{bad');
		expect(bad.status).toBe(400);
		expect(((await bad.json()) as { error: { code: string } }).error.code).toBe('INVALID_REQUEST');
		expect((await app.request('/api/enrollment-requests/none')).status).toBe(404);
		expect((await app.request('/api/courses?pageSize=99')).status).toBe(400);
	});
});
