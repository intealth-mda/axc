import { buildApplicationServicesFactory } from '@axc/application-services';
import { createDataSources } from '@axc/persistence';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRestApp } from '../index.ts';

let app: ReturnType<typeof createRestApp>;
const valid = { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: 'I need this course for upcoming secure development work.' };
async function call(path: string, method = 'GET', value?: unknown) {
	const response = await app.request(path, { method, ...(value === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }) });
	return { status: response.status, body: await response.json(), location: response.headers.get('Location') };
}
function create(overrides = {}) {
	return call('/api/enrollment-requests', 'POST', { ...valid, ...overrides });
}
function change(id: string, status: string, extra = {}) {
	return call(`/api/enrollment-requests/${id}/status`, 'PATCH', { status, changedBy: 'reviewer@example.org', ...extra });
}
beforeEach(() => {
	const dataSources = createDataSources();
	app = createRestApp(buildApplicationServicesFactory({ environment: 'test', dataSourcesFactory: () => dataSources }));
});
describe('course HTTP contract', () => {
	it('returns required fields and defaults across twelve fixtures', async () => {
		const result = await call('/api/courses');
		expect(result.status).toBe(200);
		expect(result.body).toMatchObject({ page: 1, pageSize: 10, totalItems: 12, totalPages: 2 });
		expect(result.body.items).toHaveLength(10);
		expect(Object.keys(result.body.items[0]).sort()).toEqual(['id', 'title', 'summary', 'modality', 'status', 'tags', 'createdAt', 'updatedAt'].sort());
	});
	it('matches title, summary and tags case-insensitively', async () => {
		const result = await call('/api/courses?q=SeCuRiTy&pageSize=50');
		expect(result.body.items.map((c: { id: string }) => c.id).sort()).toEqual(['course-001', 'course-002', 'course-003', 'course-006', 'course-007', 'course-012']);
	});
	it.each([
		['q=security&modality=online&status=active', ['course-001', 'course-006', 'course-012']],
		['tag=AI&status=active', ['course-010', 'course-001', 'course-005', 'course-012']],
		['modality=in-person', ['course-011', 'course-002', 'course-008']],
		['status=draft', ['course-003', 'course-008']],
		['tag=cloud', ['course-004']],
	])('filters %s', async (query, ids) => {
		const result = await call(`/api/courses?${query}`);
		expect(result.status).toBe(200);
		expect(result.body.items.map((c: { id: string }) => c.id)).toEqual(ids);
	});
	it('paginates and sorts all supported fields', async () => {
		const created = await call('/api/courses?sort=createdAt&page=2&pageSize=5');
		expect(created.body.items.map((c: { id: string }) => c.id)).toEqual(['course-006', 'course-007', 'course-008', 'course-009', 'course-010']);
		expect(created.body).toMatchObject({ page: 2, pageSize: 5, totalItems: 12, totalPages: 3 });
		const updated = await call('/api/courses?sort=updatedAt&pageSize=50');
		expect(updated.body.items.map((c: { id: string }) => c.id)).toEqual(Array.from({ length: 12 }, (_, i) => `course-${String(12 - i).padStart(3, '0')}`));
		const titles = (await call('/api/courses?pageSize=50')).body.items.map((c: { title: string }) => c.title);
		expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
	});
	it('returns empty and out-of-range pages', async () => {
		expect((await call('/api/courses?q=absent')).body).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
		expect((await call('/api/courses?page=99')).body.items).toEqual([]);
	});
	it.each([
		'modality=bad',
		'status=bad',
		'sort=bad',
		'page=0',
		'page=-1',
		'page=1.5',
		'page=1e2',
		'page=9007199254740992',
		'pageSize=0',
		'pageSize=51',
		'pageSize=abc',
		'q=',
		'tag=',
		'unknown=x',
		'page=1&page=2',
	])('rejects %s', async (query) => {
		const result = await call(`/api/courses?${query}`);
		expect(result.status).toBe(400);
		expect(result.body.error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(result.body.error.details.length).toBeGreaterThan(0);
	});
});
describe('enrollment HTTP workflow', () => {
	it('creates, retrieves and audits material fields', async () => {
		const result = await create();
		expect(result.status).toBe(201);
		const record = result.body;
		expect(result.location).toBe(`/api/enrollment-requests/${record.id}`);
		expect(record).toMatchObject({ ...valid, status: 'pending' });
		expect(record.id).toMatch(/^enroll-/);
		expect(record.createdAt).toBe(record.updatedAt);
		expect(record.statusHistory).toEqual([{ fromStatus: null, toStatus: 'pending', changedAt: record.createdAt, changedBy: 'system', reason: null }]);
		expect(await call(result.location as string)).toMatchObject({ status: 200, body: record });
	});
	it.each([
		['missing', 404, 'COURSE_NOT_FOUND'],
		['course-003', 409, 'COURSE_NOT_ACTIVE'],
		['course-007', 409, 'COURSE_NOT_ACTIVE'],
	])('validates course %s', async (courseId, status, code) => {
		const result = await create({ courseId });
		expect(result.status).toBe(status);
		expect(result.body.error.code).toBe(code);
		expect((await call('/api/enrollment-requests')).body.items).toEqual([]);
	});
	it.each([
		{ learnerEmail: 'bad' },
		{ learnerEmail: null },
		{ justification: 'short' },
		{ justification: 'x'.repeat(501) },
		{ justification: ' '.repeat(30) },
		{ courseId: '' },
		{ status: 'approved' },
		{ statusHistory: [] },
	])('rejects invalid input %j', async (overrides) => {
		const result = await create(overrides);
		expect(result.status).toBe(400);
		expect(result.body.error.code).toBe('INVALID_REQUEST');
		expect((await call('/api/enrollment-requests')).body.items).toEqual([]);
	});
	it.each([20, 500])('accepts justification boundary %i', async (size) => expect((await create({ justification: 'x'.repeat(size) })).status).toBe(201));
	it('prevents pending/approved duplicates, normalizes email, permits resubmission after cancellation', async () => {
		const first = await create();
		const duplicate = await create({ learnerEmail: ' LEARNER@EXAMPLE.ORG ' });
		expect(duplicate).toMatchObject({ status: 409, body: { error: { code: 'DUPLICATE_ACTIVE_REQUEST' } } });
		await change(first.body.id, 'approved');
		expect(await create()).toMatchObject({ status: 409, body: { error: { code: 'DUPLICATE_ACTIVE_REQUEST' } } });
		await change(first.body.id, 'cancelled');
		expect((await create()).status).toBe(201);
	});
	it('permits resubmission after rejection and different learner/course pairs', async () => {
		const first = await create();
		await change(first.body.id, 'rejected', { reason: 'No prerequisites' });
		expect((await create()).status).toBe(201);
		expect((await create({ learnerEmail: 'other@example.org' })).status).toBe(201);
		expect((await create({ courseId: 'course-004' })).status).toBe(201);
	});
	it('serializes concurrent duplicate requests', async () => {
		const results = await Promise.all([create(), create(), create()]);
		expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409]);
		expect((await call('/api/enrollment-requests')).body.items).toHaveLength(1);
	});
	it('filters independently and together', async () => {
		const a = await create();
		const b = await create({ learnerEmail: 'other@example.org' });
		const c = await create({ courseId: 'course-004' });
		await change(b.body.id, 'approved');
		for (const [query, ids] of [
			['status=pending', [a.body.id, c.body.id]],
			['courseId=course-001', [a.body.id, b.body.id]],
			['learnerEmail=LEARNER%40EXAMPLE.ORG', [a.body.id, c.body.id]],
			['status=pending&courseId=course-001&learnerEmail=learner%40example.org', [a.body.id]],
			['status=rejected', []],
		] as const) {
			const result = await call(`/api/enrollment-requests?${query}`);
			expect(result.status).toBe(200);
			expect(result.body.items.map((r: { id: string }) => r.id)).toEqual(ids);
		}
	});
	for (const from of ['pending', 'approved', 'rejected', 'cancelled'])
		for (const to of ['pending', 'approved', 'rejected', 'cancelled']) {
			const validTransition = (from === 'pending' && to !== 'pending') || (from === 'approved' && to === 'cancelled');
			it(`HTTP transition ${from} -> ${to}`, async () => {
				const first = await create();
				if (from !== 'pending') await change(first.body.id, from, { reason: 'initial reason' });
				const before = await call(`/api/enrollment-requests/${first.body.id}`);
				const result = await change(first.body.id, to, { reason: 'review reason' });
				if (validTransition) {
					expect(result.status).toBe(200);
					expect(result.body.status).toBe(to);
					expect(result.body.statusHistory).toHaveLength(before.body.statusHistory.length + 1);
					expect(result.body.statusHistory.at(-1)).toEqual({ fromStatus: from, toStatus: to, changedAt: result.body.updatedAt, changedBy: 'reviewer@example.org', reason: 'review reason' });
					expect((await call(`/api/enrollment-requests/${first.body.id}`)).body).toEqual(result.body);
				} else {
					expect(result.status).toBe(409);
					expect(result.body.error.code).toBe('INVALID_STATUS_TRANSITION');
					expect((await call(`/api/enrollment-requests/${first.body.id}`)).body).toEqual(before.body);
				}
			});
		}
	it.each([
		{ status: 'other' },
		{ status: 'rejected' },
		{ status: 'rejected', reason: ' ' },
		{ status: 'approved', changedBy: '' },
		{ status: 'approved', reason: 2 },
		{ status: 'approved', id: 'override' },
	])('rejects status input %j', async (input) => {
		const first = await create();
		const result = await call(`/api/enrollment-requests/${first.body.id}/status`, 'PATCH', { changedBy: 'reviewer', ...input });
		expect(result.status).toBe(400);
		expect(result.body.error.code).toBe('INVALID_REQUEST');
		expect((await call(`/api/enrollment-requests/${first.body.id}`)).body).toEqual(first.body);
	});
	it.each(['status=bad', 'courseId=', 'learnerEmail=bad', 'extra=x', 'status=pending&status=approved'])('validates list query %s', async (query) => {
		const result = await call(`/api/enrollment-requests?${query}`);
		expect(result).toMatchObject({ status: 400, body: { error: { code: 'INVALID_REQUEST' } } });
	});
	it('returns not-found codes for get and patch', async () => {
		expect(await call('/api/enrollment-requests/missing')).toMatchObject({ status: 404, body: { error: { code: 'ENROLLMENT_REQUEST_NOT_FOUND' } } });
		expect(await change('missing', 'approved')).toMatchObject({ status: 404, body: { error: { code: 'ENROLLMENT_REQUEST_NOT_FOUND' } } });
	});
	it.each(['{', 'null', '[]', '"text"'])('handles malformed bodies %s', async (body) => {
		const result = await app.request('/api/enrollment-requests', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
		expect(result.status).toBe(400);
		expect((await result.json()).error.code).toBe('INVALID_REQUEST');
	});
	it('does not expose unexpected exception details', async () => {
		app = createRestApp({
			forRequest: () => Promise.reject(new Error('sensitive failure')),
		});
		const result = await call('/api/courses');
		expect(result).toMatchObject({ status: 500, body: { error: { code: 'INTERNAL_ERROR' } } });
		expect(JSON.stringify(result.body)).not.toContain('sensitive');
	});
});
