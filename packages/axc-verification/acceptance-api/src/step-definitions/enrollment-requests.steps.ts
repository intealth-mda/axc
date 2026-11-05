import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isGreaterThan, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

type Body = Record<string, unknown> & { items?: Record<string, unknown>[]; error?: { code: string; details: { field: string }[] }; statusHistory?: unknown[] };

const actor = () => actorCalled('API client');
const JUSTIFICATION = 'I need this course for my upcoming work.';
let createdId = '';

const body = <T>(description: string, pick: (b: Body) => T) => resolved(Question.about(description, async (a) => pick(await a.answer(LastResponse.body<Body>()))));
const withId = (path: string) => path.replace('{id}', createdId);

const create = async (courseId: string, learnerEmail: string, justification = JUSTIFICATION) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification })));
	const id = (await actor().answer(LastResponse.body<Body>()))['id'];
	if (typeof id === 'string') createdId = id;
};

const changeStatus = (status: string, reason: string) => actor().attemptsTo(Send.a(PatchRequest.to(withId('/api/enrollment-requests/{id}/status')).with({ status, changedBy: 'reviewer@example.org', reason })));

Given('an enrollment request for {string} as {string} in status {string}', async (courseId: string, email: string, status: string) => {
	await create(courseId, email);
	if (status === 'rejected' || status === 'cancelled') await changeStatus(status, 'Setup.');
	if (status === 'approved') await changeStatus('approved', 'Setup.');
});

When('the client creates an enrollment request for {string} as {string}', (courseId: string, email: string) => create(courseId, email));

When('the client posts an enrollment request with email {string} and justification {string}', (email: string, justification: string) => create('course-001', email, justification));

When('the reviewer changes the status to {string} with reason {string}', changeStatus);

When('the client sends GET {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(withId(path)))));

When('the client sends PATCH {string}', (path: string) => actor().attemptsTo(Send.a(PatchRequest.to(withId(path)).with({ status: 'approved', changedBy: 'reviewer@example.org' }))));

Then('the response status is {int}', (code: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(code))));

Then('the error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('the error code', (b) => b.error?.code),
			equals(code),
		),
	),
);

Then('the error detail field is {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('the error detail fields', (b) => b.error?.details.map((d) => d.field) ?? []),
			contain(field),
		),
	),
);

Then('the response field {string} equals {string}', (field: string, value: string) =>
	actor().attemptsTo(
		Ensure.that(
			body(`the ${field}`, (b) => b[field]),
			equals(value),
		),
	),
);

Then('the response field {string} equals the created id', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body(`the ${field}`, (b) => b[field]),
			equals(createdId),
		),
	),
);

Then('the status history has {int} entries', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('the status history length', (b) => b.statusHistory?.length),
			equals(n),
		),
	),
);

Then('there is at least one item', () =>
	actor().attemptsTo(
		Ensure.that(
			body('the item count', (b) => b.items?.length ?? (Array.isArray(b) ? b.length : 0)),
			isGreaterThan(0),
		),
	),
);

Then('every item has {string} equal to {string}', (field: string, value: string) =>
	actor().attemptsTo(
		Ensure.that(
			body(`every ${field}`, (b) => ((Array.isArray(b) ? b : b.items) as Record<string, unknown>[]).every((item) => item[field] === value)),
			isTrue(),
		),
	),
);

Then('the doc {string} mentions {string}', (doc: string, text: string) => actor().attemptsTo(Ensure.that(readFileSync(resolve(process.cwd(), '../../../apps/docs/docs', `${doc}.md`), 'utf8'), includes(text))));
