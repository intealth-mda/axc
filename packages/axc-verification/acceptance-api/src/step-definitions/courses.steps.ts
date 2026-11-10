import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

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
const body = <T>(label: string, pick: (p: Page) => T) => resolved(Question.about(label, async (a) => pick(await a.answer(LastResponse.body<Page>()))));

When('the client requests {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the page is {int}, pageSize is {int}, totalItems is {int} and there are {int} items', (page: number, pageSize: number, total: number, count: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('page', (p) => p.page),
			equals(page),
		),
		Ensure.that(
			body('pageSize', (p) => p.pageSize),
			equals(pageSize),
		),
		Ensure.that(
			body('totalItems', (p) => p.totalItems),
			equals(total),
		),
		Ensure.that(
			body('totalPages', (p) => p.totalPages),
			equals(Math.ceil(total / pageSize)),
		),
		Ensure.that(
			body('item count', (p) => p.items.length),
			equals(count),
		),
	),
);

Then('the item ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('item ids', (p) => p.items.map((i) => i['id']).join(',')),
			equals(ids),
		),
	),
);

Then('every item has {string} equal to {string}', (field: string, value: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('item count', (p) => p.items.length > 0),
			equals(true),
		),
		Ensure.that(
			body(`distinct ${field}`, (p) => [...new Set(p.items.map((i) => i[field]))].join(',')),
			equals(value),
		),
	),
);

Then('the error code is {string} for field {string}', (code: string, field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('error code', (p) => p.error?.code),
			equals(code),
		),
		Ensure.that(
			body('error fields', (p) => p.error?.details.map((d) => d.field) ?? []),
			contain(field),
		),
	),
);

Then('the courses doc mentions {string}', (terms: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(doc, includes(t))));
});
