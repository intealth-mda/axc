import { buildApplicationServicesFactory } from '@axc/application-services';
import { buildDataSources } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createRestApp } from '../index.ts';

const app = () => createRestApp(buildApplicationServicesFactory({ environment: 'test', dataSourcesFactory: buildDataSources }));
const request = (courseId = 'course-001', learnerEmail = 'learner@example.org') => ({ courseId, learnerEmail, justification: 'This course will help me perform my role.' });
const post = (api: ReturnType<typeof app>, data: unknown) => api.request('/api/enrollment-requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
const patch = (api: ReturnType<typeof app>, id: string, data: unknown) => api.request(`/api/enrollment-requests/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
const error = async (response: Response, status: number, code: string) => {
	expect(response.status).toBe(status);
	expect((await response.json()).error.code).toBe(code);
};

describe('Course search', () => {
	it('lists defaults, keyword, filters, pagination, sorting, and no matches', async () => {
		const api = app();
		const defaults = await api.request('/api/courses');
		const data = await defaults.json();
		expect(defaults.status).toBe(200);
		expect(data.page).toBe(1);
		expect(data.pageSize).toBe(10);
		expect(data.totalItems).toBe(12);
		const keyword = await (await api.request('/api/courses?q=SeCuRiTy')).json();
		expect(keyword.items.map((x: { id: string }) => x.id)).toEqual(['course-001', 'course-005', 'course-002', 'course-006', 'course-012', 'course-004']);
		const combined = await (await api.request('/api/courses?q=security&modality=online&status=active')).json();
		expect(combined.items.map((x: { id: string }) => x.id)).toEqual(['course-001']);
		const second = await (await api.request('/api/courses?q=security&modality=in-person&status=active')).json();
		expect(second.items.map((x: { id: string }) => x.id)).toEqual(['course-004']);
		const tags = await (await api.request('/api/courses?tag=AI')).json();
		expect(tags.items.map((x: { id: string }) => x.id)).toEqual(['course-001', 'course-003']);
		const paged = await (await api.request('/api/courses?page=2&pageSize=5&sort=createdAt')).json();
		expect(paged.items.map((x: { id: string }) => x.id)).toEqual(['course-006', 'course-007', 'course-008', 'course-009', 'course-010']);
		expect(paged.totalPages).toBe(3);
		const empty = await (await api.request('/api/courses?q=nonexistent')).json();
		expect(empty).toMatchObject({ items: [], totalItems: 0, totalPages: 0 });
	});
	it.each(['modality=remote', 'status=pending', 'page=0', 'pageSize=51', 'sort=wrong', 'unknown=x'])('rejects invalid query %s', async (query) => {
		await error(await app().request(`/api/courses?${query}`), 400, 'INVALID_QUERY_PARAMETER');
	});
});

describe('Enrollment workflow', () => {
	it('creates, retrieves, filters, approves, cancels, and records history', async () => {
		const api = app();
		const creation = await post(api, request());
		expect(creation.status).toBe(201);
		const item = await creation.json();
		expect(item).toMatchObject({ courseId: 'course-001', learnerEmail: 'learner@example.org', status: 'pending' });
		expect(item.statusHistory).toMatchObject([{ fromStatus: null, toStatus: 'pending', changedBy: 'system', reason: null }]);
		const fetched = await (await api.request(`/api/enrollment-requests/${item.id}`)).json();
		expect(fetched.statusHistory).toEqual(item.statusHistory);
		const filtered = await (await api.request('/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=LEARNER@EXAMPLE.ORG')).json();
		expect(filtered.map((x: { id: string }) => x.id)).toEqual([item.id]);
		const approved = await patch(api, item.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		expect(approved.status).toBe(200);
		const approval = await approved.json();
		expect(approval.statusHistory).toHaveLength(2);
		expect(approval.statusHistory[1]).toMatchObject({ fromStatus: 'pending', toStatus: 'approved', changedBy: 'reviewer@example.org' });
		await error(await post(api, request()), 409, 'DUPLICATE_ACTIVE_REQUEST');
		const cancelled = await (await patch(api, item.id, { status: 'cancelled', changedBy: 'reviewer@example.org' })).json();
		expect(cancelled.statusHistory.map((x: { toStatus: string }) => x.toStatus)).toEqual(['pending', 'approved', 'cancelled']);
		expect(cancelled.updatedAt).toBe(cancelled.statusHistory[2].changedAt);
	});
	it('validates course, input, duplicate pending, and retrieval errors', async () => {
		const api = app();
		await error(await post(api, request('missing')), 404, 'COURSE_NOT_FOUND');
		for (const id of ['course-005', 'course-006']) await error(await post(api, request(id)), 409, 'COURSE_NOT_ACTIVE');
		await error(await post(api, request('course-001', 'invalid')), 400, 'INVALID_REQUEST');
		await error(await post(api, { ...request(), courseId: 42 }), 400, 'INVALID_REQUEST');
		await error(await post(api, { ...request(), justification: 'short' }), 400, 'INVALID_REQUEST');
		await error(await api.request('/api/enrollment-requests/missing'), 404, 'ENROLLMENT_REQUEST_NOT_FOUND');
		await post(api, request());
		await error(await post(api, request()), 409, 'DUPLICATE_ACTIVE_REQUEST');
	});
	it('rejects without reason, permits rejection with history, and blocks invalid transitions', async () => {
		const api = app();
		const item = await (await post(api, request())).json();
		await error(await patch(api, item.id, { status: 'rejected', changedBy: 'reviewer' }), 400, 'INVALID_REQUEST');
		await error(await patch(api, item.id, { status: 'unknown', changedBy: 'reviewer' }), 400, 'INVALID_REQUEST');
		await error(await patch(api, item.id, { status: 'pending', changedBy: 'reviewer' }), 409, 'INVALID_STATUS_TRANSITION');
		const before = await (await api.request(`/api/enrollment-requests/${item.id}`)).json();
		expect(before.statusHistory).toHaveLength(1);
		const rejected = await (await patch(api, item.id, { status: 'rejected', changedBy: 'reviewer', reason: 'Prerequisite missing' })).json();
		expect(rejected.statusHistory[1]).toMatchObject({ fromStatus: 'pending', toStatus: 'rejected', reason: 'Prerequisite missing' });
		await error(await patch(api, item.id, { status: 'approved', changedBy: 'reviewer' }), 409, 'INVALID_STATUS_TRANSITION');
	});
	it('allows pending cancellation and a new request after rejection', async () => {
		const api = app();
		const first = await (await post(api, request())).json();
		const cancelled = await (await patch(api, first.id, { status: 'cancelled', changedBy: 'learner' })).json();
		expect(cancelled.status).toBe('cancelled');
		expect((await post(api, request())).status).toBe(201);
	});
});
