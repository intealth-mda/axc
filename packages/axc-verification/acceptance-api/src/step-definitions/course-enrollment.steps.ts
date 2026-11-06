import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

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
interface Enrollment {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: { fromStatus: string | null; toStatus: string; changedAt: string; changedBy: string; reason: string | null }[];
}
const actor = () => actorCalled('API client');
let email = '';
let id = '';
let original: Enrollment | undefined;
Before(() => {
	email = `learner-${randomUUID()}@example.org`;
	id = '';
	original = undefined;
});
const valid = () => ({ courseId: 'course-001', learnerEmail: email, justification: 'I need this course for my upcoming project.' });
const response = <T>() => actor().answer(LastResponse.body<T>());
const statusIs = async (expected: number) => {
	assert.equal(await actor().answer(LastResponse.status()), expected);
};
const create = () => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(valid())));
const patch = (status: string, reason?: string) =>
	actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${id}/status`).with({ status, changedBy: 'reviewer@example.org', ...(reason === undefined ? {} : { reason }) })));
Given('an enrollment in status {string}', async (status: string) => {
	await create();
	await statusIs(201);
	original = await response<Enrollment>();
	id = original.id;
	if (status !== 'pending') {
		await patch(status, 'Prerequisite missing');
		await statusIs(200);
	}
});
When('the catalog is searched with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${query}`))));
Then('the catalog has default pagination', async () => {
	await statusIs(200);
	const body = await response<Page>();
	assert.equal(body.page, 1);
	assert.equal(body.pageSize, 10);
	assert.equal(body.totalItems, 12);
	assert.equal(body.totalPages, 2);
	assert.equal(body.items.length, 10);
	for (const course of body.items) for (const key of ['id', 'title', 'summary', 'tags', 'modality', 'status', 'createdAt', 'updatedAt']) assert.ok(Object.hasOwn(course, key));
});
Then('the catalog contains exactly courses {string}', async (ids: string) => {
	await statusIs(200);
	const body = await response<Page>();
	assert.deepEqual(
		body.items.map((c) => c.id),
		ids ? ids.split(',') : [],
	);
	if (!ids) {
		assert.equal(body.totalItems, 0);
		assert.equal(body.totalPages, 0);
	}
});
Then('the catalog field {string} equals {string}', async (field: string, value: string) => {
	await statusIs(200);
	const body = await response<Page>();
	assert.ok(body.items.length > 0);
	for (const course of body.items) assert.equal(course[field as 'modality' | 'status'], value);
});
Then('the catalog has five results on page two', async () => {
	await statusIs(200);
	const body = await response<Page>();
	assert.equal(body.items.length, 5);
	assert.equal(body.page, 2);
	assert.equal(body.pageSize, 5);
	assert.equal(body.totalPages, 3);
});
Then('the catalog is ordered by {string}', async (field: 'title' | 'createdAt' | 'updatedAt') => {
	await statusIs(200);
	const body = await response<Page>();
	assert.ok(body.items.length > 1);
	const values = body.items.map((c) => c[field]);
	assert.deepEqual(
		values,
		[...values].sort((a, b) => a.localeCompare(b)),
	);
});
Then('the workflow responds with {int} and error {string}', async (status: number, code: string) => {
	await statusIs(status);
	const body = await response<{ error: { code: string; message: string; details: unknown[] } }>();
	assert.equal(body.error.code, code);
	assert.ok(body.error.message);
	assert.ok(Array.isArray(body.error.details));
});
When('a valid enrollment is submitted', create);
When('an enrollment is submitted with field {string} set to {string}', (field: string, value: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ ...valid(), [field]: value }))));
When('the same learner submits another enrollment', create);
When('the enrollment is retrieved', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When('a missing enrollment is retrieved', () => actor().attemptsTo(Send.a(GetRequest.to('/api/enrollment-requests/missing'))));
When('a missing enrollment is updated', () => actor().attemptsTo(Send.a(PatchRequest.to('/api/enrollment-requests/missing/status').with({ status: 'approved', changedBy: 'reviewer' }))));
When('the enrollment status becomes {string} with reason {string}', (status: string, reason: string) => patch(status, reason));
When('enrollments are filtered by {string}', (filter: string) => {
	const queries: Record<string, string> = {
		status: 'status=pending',
		courseId: 'courseId=course-001',
		learnerEmail: `learnerEmail=${encodeURIComponent(email.toUpperCase())}`,
		combined: `status=pending&courseId=course-001&learnerEmail=${encodeURIComponent(email)}`,
	};
	return actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?${queries[filter] ?? filter}`)));
});
Then('the enrollment is pending with {int} creation history entries', async (count: number) => {
	await statusIs(201);
	const body = await response<Enrollment>();
	assert.ok(body.id);
	assert.equal(body.courseId, 'course-001');
	assert.equal(body.learnerEmail, email);
	assert.equal(body.justification, valid().justification);
	assert.equal(body.status, 'pending');
	assert.equal(body.statusHistory.length, count);
	assert.equal(body.createdAt, body.updatedAt);
	assert.equal(new Date(body.createdAt).toISOString(), body.createdAt);
	assert.deepEqual(body.statusHistory, [{ fromStatus: null, toStatus: 'pending', changedAt: body.createdAt, changedBy: 'system', reason: null }]);
});
Then('the retrieved enrollment retains its history', async () => {
	await statusIs(200);
	assert.deepEqual(await response<Enrollment>(), original);
});
Then('the filtered enrollments match {string}', async (filter: string) => {
	await statusIs(200);
	const list = await response<Enrollment[]>();
	assert.ok(list.some((r) => r.id === id));
	for (const r of list) {
		if (['status', 'combined'].includes(filter)) assert.equal(r.status, 'pending');
		if (['courseId', 'combined'].includes(filter)) assert.equal(r.courseId, 'course-001');
		if (['learnerEmail', 'combined'].includes(filter)) assert.equal(r.learnerEmail, email);
	}
});
Then('the enrollment has status {string} and {int} audit entries', async (status: string, count: number) => {
	await statusIs(200);
	const body = await response<Enrollment>();
	assert.equal(body.status, status);
	assert.equal(body.statusHistory.length, count);
	const entry = body.statusHistory.at(-1);
	assert.ok(entry);
	assert.equal(entry.toStatus, status);
	assert.equal(entry.changedBy, 'reviewer@example.org');
	assert.equal(entry.changedAt, body.updatedAt);
	assert.equal(entry.fromStatus, count === 3 ? 'approved' : 'pending');
	if (status === 'rejected') assert.equal(entry.reason, 'Prerequisite missing');
	assert.deepEqual(body.statusHistory[0], original?.statusHistory[0]);
});
