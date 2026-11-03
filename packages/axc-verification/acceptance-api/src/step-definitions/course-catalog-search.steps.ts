import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface Course {
	id: string;
	modality: string;
	status: string;
	createdAt: string;
}
interface Page {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	error?: { code: string; details: { field: string }[] };
}

const actor = () => actorCalled('API client');
const body = <T>(description: string, pick: (b: Page) => T) => resolved(Question.about(description, async (a) => pick(await a.answer(LastResponse.body<Page>()))));

When('the client requests {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the courses response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the response has page {int}, pageSize {int}, totalItems {int} and {int} items', (page: number, pageSize: number, totalItems: number, count: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('pagination', (b) => [b.page, b.pageSize, b.totalItems, b.items.length]),
			equals([page, pageSize, totalItems, count]),
		),
	),
);

Then('the response reports {int} total pages', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('total pages', (b) => b.totalPages),
			equals(n),
		),
	),
);

Then('the returned course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('ids', (b) => b.items.map((c) => c.id).sort()),
			equals(ids.split(',').sort()),
		),
	),
);

Then('every returned course has {word} {string}', (field: 'modality' | 'status', value: string) =>
	actor().attemptsTo(
		Ensure.that(
			body(`every ${field}`, (b) => b.items.length > 0 && b.items.every((c) => c[field] === value)),
			isTrue(),
		),
	),
);

Then('the returned courses are sorted by {string}', (field: 'createdAt') =>
	actor().attemptsTo(
		Ensure.that(
			body('sorted', (b) => b.items.every((c, i, all) => i === 0 || (all[i - 1]?.[field] ?? '') <= c[field])),
			isTrue(),
		),
	),
);

Then('the error names field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('error code', (b) => b.error?.code),
			equals('INVALID_QUERY_PARAMETER'),
		),
		Ensure.that(
			body('error fields', (b) => (b.error?.details ?? []).map((d) => d.field).join(',')),
			includes(field),
		),
	),
);

Then('the courses documentation lists the path, query parameters, success and error responses', () => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/course-catalog-search.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...['GET /api/courses', 'pageSize', 'modality', 'sort', '"items"', 'INVALID_QUERY_PARAMETER'].map((s) => Ensure.that(doc, includes(s))));
});
