import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isGreaterThan, isTrue, not } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface Page {
	items: Record<string, string>[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	error?: { code: string; details: { field: string }[] };
}

const actor = () => actorCalled('API client');
const body = <T>(label: string, pick: (b: Page) => T) => resolved(Question.about(label, async (a) => pick(await a.answer(LastResponse.body<Page>()))));

When('the client requests {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the response has page {int}, pageSize {int} and at most {int} items', (page: number, pageSize: number, max: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('page', (b) => b.page),
			equals(page),
		),
		Ensure.that(
			body('pageSize', (b) => b.pageSize),
			equals(pageSize),
		),
		Ensure.that(
			body('item count', (b) => b.items.length),
			not(isGreaterThan(max)),
		),
	),
);

Then('the response reports {int} total items over {int} pages', (total: number, pages: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('totalItems', (b) => b.totalItems),
			equals(total),
		),
		Ensure.that(
			body('totalPages', (b) => b.totalPages),
			equals(pages),
		),
	),
);

Then('the item ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('item ids', (b) => b.items.map((i) => i['id']).join(',')),
			equals(ids),
		),
	),
);

Then('every item has {string} equal to {string}', (field: string, value: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('item count', (b) => b.items.length),
			isGreaterThan(0),
		),
		Ensure.that(
			body(`every ${field}`, (b) => b.items.every((i) => i[field] === value)),
			isTrue(),
		),
	),
);

Then('the error code is {string} for field {string}', (code: string, field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('error code', (b) => b.error?.code),
			equals(code),
		),
		Ensure.that(
			body('error fields', (b) => (b.error?.details ?? []).map((d) => d.field).join(',')),
			equals(field),
		),
	),
);

Then('the courses doc mentions {string}', (terms: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(doc, includes(t))));
});
