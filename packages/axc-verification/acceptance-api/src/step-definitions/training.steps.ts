import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { When } from '@cucumber/cucumber';

interface Course {
	id: string;
	title: string;
	summary: string;
	tags: string[];
	modality: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}
interface Page {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
interface History {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}
interface Enrollment {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: History[];
}
const request = async <T>(path: string, method = 'GET', body?: unknown, status = 200): Promise<T> => {
	const response = await fetch(`http://127.0.0.1:7071${path}`, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
	const value: unknown = await response.json();
	assert.equal(response.status, status, JSON.stringify(value));
	return value as T;
};
const failure = async (path: string, method: string, body: unknown, status: number, code: string): Promise<void> => {
	const value = await request<{ error: { code: string; message: string; details: unknown[] } }>(path, method, body, status);
	assert.equal(value.error.code, code);
	assert.equal(typeof value.error.message, 'string');
	assert.ok(Array.isArray(value.error.details));
};
When('the client verifies course search through the running host', async () => {
	const defaults = await request<Page>('/api/courses');
	assert.equal(defaults.page, 1);
	assert.equal(defaults.pageSize, 10);
	assert.equal(defaults.items.length, 10);
	assert.equal(defaults.totalItems, 12);
	assert.equal(defaults.totalPages, 2);
	const ids = async (query: string) => (await request<Page>(`/api/courses?pageSize=50&${query}`)).items.map((row) => row.id);
	assert.deepEqual(await ids('q=SeCuRiTy'), ['course-001', 'course-003', 'course-008', 'course-005', 'course-012', 'course-002']);
	assert.deepEqual(await ids('modality=online'), ['course-001', 'course-003', 'course-008', 'course-004', 'course-011']);
	assert.deepEqual(await ids('status=active'), ['course-001', 'course-008', 'course-006', 'course-004', 'course-012', 'course-002', 'course-009', 'course-010']);
	assert.deepEqual(await ids('tag=AI'), ['course-001', 'course-003', 'course-006']);
	assert.deepEqual(await ids('q=security&modality=online&status=active'), ['course-001', 'course-008']);
	assert.deepEqual(await ids('tag=ai&modality=hybrid&status=active'), ['course-006']);
	const all = await ids('');
	const page = await request<Page>('/api/courses?page=2&pageSize=5');
	assert.deepEqual(
		page.items.map((row) => row.id),
		all.slice(5, 10),
	);
	assert.equal(page.totalPages, 3);
	for (const sort of ['title', 'createdAt', 'updatedAt'] as const) {
		const rows = (await request<Page>(`/api/courses?sort=${sort}&pageSize=50`)).items;
		assert.deepEqual(
			rows.map((row) => row[sort]),
			rows.map((row) => row[sort]).toSorted((a, b) => a.localeCompare(b)),
		);
	}
	assert.deepEqual(await request<Page>('/api/courses?q=no-matching-course'), { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
	for (const query of ['modality=bad', 'status=bad', 'page=0', 'page=1.5', 'pageSize=51', 'sort=bad', 'page=1&page=2', 'unknown=x']) await failure(`/api/courses?${query}`, 'GET', undefined, 400, 'INVALID_QUERY_PARAMETER');
});
When('the client verifies enrollment workflows through the running host', async () => {
	const root = '/api/enrollment-requests';
	const email = `learner-${randomUUID()}@example.org`;
	const input = { courseId: 'course-001', learnerEmail: email, justification: 'I need this course to prepare for secure development work.' };
	const item = await request<Enrollment>(root, 'POST', input, 201);
	assert.match(item.id, /^enroll-/);
	assert.equal(item.status, 'pending');
	assert.equal(item.courseId, input.courseId);
	assert.equal(item.learnerEmail, email);
	assert.equal(item.justification, input.justification);
	assert.equal(item.updatedAt, item.createdAt);
	assert.ok(Number.isFinite(Date.parse(item.createdAt)));
	assert.deepEqual(item.statusHistory, [{ fromStatus: null, toStatus: 'pending', changedAt: item.createdAt, changedBy: 'system', reason: null }]);
	assert.deepEqual(await request<Enrollment>(`${root}/${item.id}`), item);
	const mutate = (id: string, status: string, reason?: string) => request<Enrollment>(`${root}/${id}/status`, 'PATCH', { status, changedBy: 'reviewer@example.org', ...(reason === undefined ? {} : { reason }) });
	for (const courseId of ['missing', 'course-003', 'course-005']) await failure(root, 'POST', { ...input, courseId }, courseId === 'missing' ? 404 : 409, courseId === 'missing' ? 'COURSE_NOT_FOUND' : 'COURSE_NOT_ACTIVE');
	for (const bad of [{ learnerEmail: 'bad' }, { justification: 'short' }, { justification: 'x'.repeat(501) }, { courseId: null }]) await failure(root, 'POST', { ...input, ...bad }, 400, 'INVALID_REQUEST');
	await failure(root, 'POST', { ...input, learnerEmail: email.toUpperCase() }, 409, 'DUPLICATE_ACTIVE_REQUEST');
	const approved = await mutate(item.id, 'approved');
	assert.equal(approved.status, 'approved');
	assert.equal(approved.createdAt, item.createdAt);
	assert.deepEqual(approved.statusHistory, [...item.statusHistory, { fromStatus: 'pending', toStatus: 'approved', changedAt: approved.updatedAt, changedBy: 'reviewer@example.org', reason: null }]);
	await failure(root, 'POST', input, 409, 'DUPLICATE_ACTIVE_REQUEST');
	for (const bad of [
		{ status: 'bad', changedBy: 'reviewer' },
		{ status: 'rejected', changedBy: 'reviewer' },
		{ status: 'rejected', changedBy: 'reviewer', reason: '   ' },
		{ status: 'approved', changedBy: '' },
	])
		await failure(`${root}/${item.id}/status`, 'PATCH', bad, 400, 'INVALID_REQUEST');
	await failure(`${root}/${item.id}/status`, 'PATCH', { status: 'rejected', changedBy: 'reviewer', reason: 'Missing prerequisite' }, 409, 'INVALID_STATUS_TRANSITION');
	assert.deepEqual(await request(`${root}/${item.id}`), approved);
	await failure(`${root}/missing`, 'GET', undefined, 404, 'ENROLLMENT_REQUEST_NOT_FOUND');
	await failure(`${root}/missing/status`, 'PATCH', { status: 'approved', changedBy: 'reviewer' }, 404, 'ENROLLMENT_REQUEST_NOT_FOUND');
	const cancelled = await mutate(item.id, 'cancelled');
	assert.equal(cancelled.status, 'cancelled');
	assert.deepEqual(cancelled.statusHistory, [...approved.statusHistory, { fromStatus: 'approved', toStatus: 'cancelled', changedAt: cancelled.updatedAt, changedBy: 'reviewer@example.org', reason: null }]);
	const replacement = await request<Enrollment>(root, 'POST', input, 201);
	const rejected = await mutate(replacement.id, 'rejected', 'Missing prerequisite');
	assert.equal(rejected.status, 'rejected');
	assert.deepEqual(rejected.statusHistory, [...replacement.statusHistory, { fromStatus: 'pending', toStatus: 'rejected', changedAt: rejected.updatedAt, changedBy: 'reviewer@example.org', reason: 'Missing prerequisite' }]);
	const pending = await request<Enrollment>(root, 'POST', input, 201);
	const other = await request<Enrollment>(root, 'POST', { ...input, learnerEmail: `other-${email}` }, 201);
	const differentCourse = await request<Enrollment>(root, 'POST', { ...input, courseId: 'course-002' }, 201);
	await mutate(other.id, 'approved');
	const list = async (query: string) => request<Enrollment[]>(`${root}?${query}`);
	const all = await list('');
	// Each independent filter has counterexamples differing only on that field.
	for (const [field, value] of [
		['status', 'pending'],
		['courseId', 'course-001'],
		['learnerEmail', email],
	] as const) {
		const rows = await list(`${field}=${encodeURIComponent(value)}`);
		assert.deepEqual(
			rows.map((row) => row.id),
			all.filter((row) => row[field] === value).map((row) => row.id),
		);
	}
	assert.deepEqual(
		(await list(`status=pending&courseId=course-001&learnerEmail=${email}`)).map((row) => row.id),
		[pending.id],
	);
	assert.deepEqual(
		(await list(`learnerEmail=${email.toUpperCase()}`)).map((row) => row.id),
		[item.id, replacement.id, pending.id, differentCourse.id],
	);
	const pendingCancelled = await mutate(pending.id, 'cancelled');
	assert.equal(pendingCancelled.status, 'cancelled');
	assert.deepEqual(pendingCancelled.statusHistory, [...pending.statusHistory, { fromStatus: 'pending', toStatus: 'cancelled', changedAt: pendingCancelled.updatedAt, changedBy: 'reviewer@example.org', reason: null }]);
	for (const query of ['status=bad', 'learnerEmail=bad', 'status=pending&status=approved']) await failure(`${root}?${query}`, 'GET', undefined, 400, 'INVALID_REQUEST');
	const malformed = await fetch(`http://127.0.0.1:7071${root}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
	assert.equal(malformed.status, 400);
	assert.equal(((await malformed.json()) as { error: { code: string } }).error.code, 'INVALID_REQUEST');
});
