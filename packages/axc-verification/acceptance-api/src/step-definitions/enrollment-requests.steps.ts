import { readFileSync } from 'node:fs';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

const actor = () => actorCalled('API client');
const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';
let lastId = '';

const withId = (path: string) => path.replace('{id}', lastId);

const field = (path: string) =>
	Question.about(`response field ${path}`, async (a) => {
		let value: unknown = await a.answer(LastResponse.body<unknown>());
		for (const key of path.split('.')) value = (value as Record<string, unknown> | null)?.[key];
		return String(value);
	});

const rememberId = () =>
	Question.about('created id', async (a) => {
		lastId = (await a.answer(LastResponse.body<{ id: string }>())).id;
		return lastId;
	});

const create = (courseId: string, learnerEmail: string, justification = JUSTIFICATION) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification })));

When('the client GETs {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(withId(path)))));

When('{string} requests enrollment in {string}', (email: string, courseId: string) => create(courseId, email));

When('{string} requests enrollment in {string} with justification {string}', (email: string, courseId: string, justification: string) => create(courseId, email, justification));

Given('{string} has a request for {string}', async (email: string, courseId: string) => {
	await create(courseId, email);
	await actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(201)), Ensure.that(resolved(rememberId()), includes('-')));
});

When('the request status is changed to {string} by {string}', (status: string, changedBy: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy }))));

When('the request status is changed to {string} by {string} because {string}', (status: string, changedBy: string, reason: string) =>
	actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy, reason }))),
);

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the response has:', (table: DataTable) => actor().attemptsTo(...table.raw().map(([path = '', expected = '']) => Ensure.that(resolved(field(path)), equals(withId(expected))))));

Then('the {string} docs page mentions:', (page: string, table: DataTable) => {
	const doc = readFileSync(new URL(`../../../../../apps/docs/docs/${page}.md`, import.meta.url), 'utf8');
	return actor().attemptsTo(...table.raw().map(([text = '']) => Ensure.that(doc, includes(text))));
});
