import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface Course {
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
}
interface Page {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	error?: { details: { field: string }[] };
}

const actor = () => actorCalled('API client');
const body = <T>(description: string, pick: (b: Page) => T) => resolved(Question.about(description, async (a) => pick(await a.answer(LastResponse.body<Page>()))));

When('the client requests {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the courses response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the courses page is {int} with page size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('page', (b) => b.page),
			equals(page),
		),
		Ensure.that(
			body('pageSize', (b) => b.pageSize),
			equals(size),
		),
	),
);

Then('the courses response has {int} items', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('item count', (b) => b.items.length),
			equals(n),
		),
	),
);

Then('the courses total is {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('totalItems', (b) => b.totalItems),
			equals(n),
		),
	),
);

Then('every course mentions {string}', (word: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('all mention', (b) => b.items.every((c) => [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(word)))),
			isTrue(),
		),
	),
);

Then('every course has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('all modality', (b) => b.items.length > 0 && b.items.every((c) => c.modality === m)),
			isTrue(),
		),
	),
);

Then('every course has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('all status', (b) => b.items.length > 0 && b.items.every((c) => c.status === s)),
			isTrue(),
		),
	),
);

Then('every course has tag {string}', (t: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('all tag', (b) => b.items.length > 0 && b.items.every((c) => c.tags.some((x) => x.toLowerCase() === t))),
			isTrue(),
		),
	),
);

Then('the courses are sorted by {string}', (field: 'createdAt') =>
	actor().attemptsTo(
		Ensure.that(
			body('sorted', (b) => b.items.every((c, i, all) => i === 0 || (all[i - 1] as Course)[field] <= c[field])),
			isTrue(),
		),
	),
);

Then('the error names field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('error field', (b) => b.error?.details[0]?.field ?? ''),
			equals(field),
		),
	),
);

Then('the courses doc mentions {string}', (terms: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...terms.split(', ').map((t) => Ensure.that(doc, includes(t))));
});
