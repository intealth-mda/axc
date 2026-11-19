import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const send = (method: string, path: string, body?: string) => app.request(path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body }) });

describe('rest', () => {
	it('routes and maps errors', async () => {
		expect((await send('GET', '/api/courses')).status).toBe(200);
		expect((await send('GET', '/api/courses?pageSize=99')).status).toBe(400);
		const created = await send('POST', '/api/enrollment-requests', JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@t.io', justification: 'x'.repeat(30) }));
		expect(created.status).toBe(201);
		const { id } = (await created.json()) as { id: string };
		expect((await send('GET', `/api/enrollment-requests/${id}`)).status).toBe(200);
		expect((await send('GET', '/api/enrollment-requests?status=pending')).status).toBe(200);
		expect((await send('PATCH', `/api/enrollment-requests/${id}/status`, '{"status":"approved","changedBy":"r"}')).status).toBe(200);
		expect((await send('PATCH', `/api/enrollment-requests/${id}/status`, '{"status":"rejected","changedBy":"r","reason":"x"}')).status).toBe(409);
		expect((await send('GET', '/api/enrollment-requests/none')).status).toBe(404);
		const bad = await send('POST', '/api/enrollment-requests', '{bad');
		expect(bad.status).toBe(400);
		expect(((await bad.json()) as { error: { code: string } }).error.code).toBe('INVALID_REQUEST');
	});
});
