import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const send = (method: string, path: string, body?: string) => app.request(path, body === undefined ? { method } : { method, body, headers: { 'Content-Type': 'application/json' } });

describe('rest routes', () => {
	it('wires courses, enrollment requests and error mapping', async () => {
		expect((await send('GET', '/api/courses?status=active')).status).toBe(200);
		const bad = await send('GET', '/api/courses?pageSize=99');
		expect([bad.status, ((await bad.json()) as { error: { code: string } }).error.code]).toEqual([400, 'INVALID_QUERY_PARAMETER']);
		const created = await send('POST', '/api/enrollment-requests', JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@b.org', justification: 'I need this for my upcoming work.' }));
		expect(created.status).toBe(201);
		const { id } = (await created.json()) as { id: string };
		expect((await send('GET', `/api/enrollment-requests/${id}`)).status).toBe(200);
		expect((await send('GET', '/api/enrollment-requests?courseId=course-001')).status).toBe(200);
		expect((await send('PATCH', `/api/enrollment-requests/${id}/status`, '{"status":"approved","changedBy":"rev"}')).status).toBe(200);
		expect((await send('PATCH', `/api/enrollment-requests/${id}/status`, '{"status":"pending","changedBy":"rev"}')).status).toBe(409);
		expect((await send('POST', '/api/enrollment-requests', '{bad')).status).toBe(400);
		expect((await send('GET', '/api/enrollment-requests/nope')).status).toBe(404);
	});
});
