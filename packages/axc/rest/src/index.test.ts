import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

const app = () => createRestApp(buildApplicationServicesFactory({ environment: 'test' }));
const send = (method: string, body: string) => ({ method, body, headers: { 'Content-Type': 'application/json' } });

describe('rest app', () => {
	it('serves health and course search', async () => {
		const rest = app();
		expect((await rest.request('/health')).status).toBe(200);
		expect(await (await rest.request('/api/courses?pageSize=2')).json()).toMatchObject({ page: 1, pageSize: 2 });
	});

	it('maps service errors to status and error body', async () => {
		const rest = app();
		const bad = await rest.request('/api/courses?pageSize=99');
		expect(bad.status).toBe(400);
		expect(await bad.json()).toMatchObject({ error: { code: 'INVALID_QUERY_PARAMETER', details: [{ field: 'pageSize' }] } });
		expect((await rest.request('/api/enrollment-requests', send('POST', '{oops'))).status).toBe(400);
		expect((await rest.request('/api/enrollment-requests/missing')).status).toBe(404);
	});

	it('creates, lists and patches enrollment requests', async () => {
		const rest = app();
		const created = await rest.request('/api/enrollment-requests', send('POST', JSON.stringify({ courseId: 'course-001', learnerEmail: 'r@x.org', justification: 'x'.repeat(25) })));
		expect(created.status).toBe(201);
		const { id } = (await created.json()) as { id: string };
		expect(await (await rest.request('/api/enrollment-requests?learnerEmail=r@x.org')).json()).toMatchObject({ items: [{ id }] });
		const patched = await rest.request(`/api/enrollment-requests/${id}/status`, send('PATCH', JSON.stringify({ status: 'cancelled', changedBy: 'rev' })));
		expect(await patched.json()).toMatchObject({ status: 'cancelled' });
		expect((await rest.request(`/api/enrollment-requests/${id}/status`, send('PATCH', JSON.stringify({ status: 'approved', changedBy: 'rev' })))).status).toBe(409);
	});
});
