import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = () => createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const send = (a: ReturnType<typeof app>, method: string, path: string, body?: string) => a.request(path, { method, headers: { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body }) });

describe('rest', () => {
	it('creates (201) and patches an enrollment request', async () => {
		const a = app();
		const res = await send(a, 'POST', '/api/enrollment-requests', JSON.stringify({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(30) }));
		expect(res.status).toBe(201);
		const { id } = (await res.json()) as { id: string };
		expect((await send(a, 'PATCH', `/api/enrollment-requests/${id}/status`, '{"status":"approved","changedBy":"r"}')).status).toBe(200);
	});

	it.each([
		['GET', '/api/courses?pageSize=99', undefined, 400],
		['POST', '/api/enrollment-requests', '{not json', 400],
		['GET', '/api/enrollment-requests/nope', undefined, 404],
		['POST', '/api/enrollment-requests', JSON.stringify({ courseId: 'course-003', learnerEmail: 'a@b.org', justification: 'x'.repeat(30) }), 409],
	])('%s %s -> %i with error envelope', async (method, path, body, status) => {
		const res = await send(app(), method, path, body);
		expect(res.status).toBe(status);
		expect(((await res.json()) as { error: { code: string } }).error.code).toBeTypeOf('string');
	});
});
