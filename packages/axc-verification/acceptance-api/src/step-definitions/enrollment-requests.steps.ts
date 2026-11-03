import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
const actor = () => actorCalled('API client');
const justification = 'I need this course for my upcoming project work.';
let lastId = '';

const field = (path: string) =>
	Question.about(`the response ${path}`, async (a) => {
		const value = path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown> | null)?.[k], await a.answer(LastResponse.body<unknown>()));
		return String(value);
	});

const items = () => Question.about('the response items', async (a) => (await a.answer(LastResponse.body<{ items: Record<string, string>[] }>())).items);

const create = async (body: Record<string, string>) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(body)));
	lastId = String(await actor().answer(field('id')));
};

const changeStatus = (status: string, reason: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: 'reviewer@example.org', ...(reason ? { reason } : {}) })));

When('the client sends GET {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path.replace('{id}', lastId)))));

When('{string} requests enrollment in {string}', (learnerEmail: string, courseId: string) => create({ courseId, learnerEmail, justification }));

When('the client posts an enrollment request with email {string} and justification {string}', (learnerEmail: string, text: string) => create({ courseId: 'course-001', learnerEmail, justification: text }));

Given('{string} has a {string} request for {string}', async (learnerEmail: string, status: string, courseId: string) => {
	await create({ courseId, learnerEmail, justification });
	if (status !== 'pending') await changeStatus(status, 'Seeded by the scenario.');
	await actor().attemptsTo(Ensure.that(resolved(field('status')), equals(status)));
});

When('the reviewer changes the status to {string} with reason {string}', changeStatus);

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the response field {string} is {string}', (path: string, expected: string) => actor().attemptsTo(Ensure.that(resolved(field(path)), equals(expected))));

Then('every item has {string} equal to {string}', (key: string, expected: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('all items match', async (a) => {
					const list = await a.answer(items());
					return list.length > 0 && list.every((i) => i[key] === expected);
				}),
			),
			isTrue(),
		),
	),
);

Then('the items are sorted by {string}', (key: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('items are sorted', async (a) => {
					const v = (await a.answer(items())).map((i) => String(i[key]));
					return v.every((x, n) => n === 0 || (v[n - 1] ?? '') <= x);
				}),
			),
			isTrue(),
		),
	),
);

Then('the docs page {string} mentions {string}', (page: string, terms: string) => {
	const doc = readFileSync(`../../../apps/docs/docs/${page}`, 'utf8');
	return actor().attemptsTo(...terms.split(', ').map((term) => Ensure.that(doc, includes(term))));
});
