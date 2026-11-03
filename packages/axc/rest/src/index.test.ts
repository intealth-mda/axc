import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const send = (method: string, path: string, body?: string) => app.request(path, body === undefined ? { method } : { method, body, headers: { 'Content-Type': 'application/json' } });

describe('rest app', () => {
	it('wires enrollment routes and returns 201 on create', async () => {
		const created = await send('POST', '/api/enrollment-requests', JSON.stringify({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(20) }));
		expect(created.status).toBe(201);
		const patched = await send('PATCH', '/api/enrollment-requests/enroll-001/status', JSON.stringify({ status: 'approved', changedBy: 'r' }));
		expect(await patched.json()).toMatchObject({ status: 'approved' });
	});

	it.each([
		['GET', '/api/courses?page=0', undefined, 400, 'INVALID_QUERY_PARAMETER'],
		['POST', '/api/enrollment-requests', '{not json', 400, 'INVALID_REQUEST'],
		['GET', '/api/enrollment-requests/missing', undefined, 404, 'ENROLLMENT_REQUEST_NOT_FOUND'],
	])('%s %s maps errors to %i', async (method, path, body, status, code) => {
		const res = await send(method, path, body);
		expect(res.status).toBe(status);
		expect(await res.json()).toMatchObject({ error: { code } });
	});
});
