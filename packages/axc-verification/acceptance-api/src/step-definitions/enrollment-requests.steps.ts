import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isTrue, not } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
const actor = () => actorCalled('API client');
const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';
const REVIEWER = 'reviewer@example.org';

let lastId = '';
const withId = (path: string) => path.replace('{id}', lastId);
const parse = (body: string): unknown => {
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
};

const field = (path: string) =>
	Question.about(`the response field ${path}`, async (a) => {
		let v: unknown = await a.answer(LastResponse.body<unknown>());
		for (const k of path.split('.')) v = (v as Record<string, unknown> | undefined)?.[k];
		return String(v);
	});

const create = (email: string, courseId: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail: email, justification: JUSTIFICATION })));
const patch = (status: string, reason?: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: REVIEWER, reason })));

When('the client sends GET {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(withId(path)))));
When('the client posts to {string} the body {string}', (path: string, body: string) => actor().attemptsTo(Send.a(PostRequest.to(withId(path)).with(parse(body)))));
When('the client patches {string} the body {string}', (path: string, body: string) => actor().attemptsTo(Send.a(PatchRequest.to(withId(path)).with(parse(body)))));
When('{string} requests enrollment in {string}', create);
When('the client changes the status to {string} with reason {string}', (status: string, reason: string) => patch(status, reason));

Given('{string} has a {string} request for {string}', async (email: string, status: string, courseId: string) => {
	await create(email, courseId);
	lastId = (await actor().answer(LastResponse.body<{ id: string }>())).id;
	const path: Record<string, string[]> = { pending: [], approved: ['approved'], rejected: ['rejected'], cancelled: ['approved', 'cancelled'] };
	for (const s of path[status] ?? []) await patch(s, 'Prerequisites are missing.');
});

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the response field {string} is {string}', (path: string, value: string) => actor().attemptsTo(Ensure.that(resolved(field(path)), equals(value))));
Then('the response field {string} is not {string}', (path: string, value: string) => actor().attemptsTo(Ensure.that(resolved(field(path)), not(equals(value)))));
Then('every item has {string} equal to {string}', (key: string, value: string) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about(`every item ${key}`, async (a) => (await a.answer(LastResponse.body<{ items: Record<string, unknown>[] }>())).items.every((i) => i[key] === value))), isTrue())),
);

Then('the enrollment requests doc mentions every endpoint and error code', () => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/enrollment-requests.md', import.meta.url), 'utf8');
	const required = [
		'POST /api/enrollment-requests',
		'GET /api/enrollment-requests/:id',
		'GET /api/enrollment-requests',
		'PATCH /api/enrollment-requests/:id/status',
		'INVALID_REQUEST',
		'COURSE_NOT_FOUND',
		'COURSE_NOT_ACTIVE',
		'DUPLICATE_ACTIVE_REQUEST',
		'ENROLLMENT_REQUEST_NOT_FOUND',
		'INVALID_STATUS_TRANSITION',
	];
	return actor().attemptsTo(Ensure.that(required.filter((r) => !doc.includes(r)).join(', '), equals('')));
});
