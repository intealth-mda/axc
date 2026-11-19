import { readFile } from 'node:fs/promises';
import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isGreaterThan, isTrue, not } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
}
interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const page = <R>(pick: (b: CoursePage) => R) => body(pick);

When('the client searches courses with {string}', (q: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${q}`))));
Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: ErrorBody) => b.error.code),
			equals(code),
		),
	),
);
Then('the error names field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: ErrorBody) => b.error.details.map((d) => d.field)),
			contain(field),
		),
	),
);
Then('the total is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.totalItems),
			isGreaterThan(n - 1),
		),
	),
);
Then('the results include modalities {string} and statuses {string}', (m: string, s: string) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => [...new Set(b.items.map((c) => c.modality))].sort().join(',')),
			equals(m.split(',').sort().join(',')),
		),
		Ensure.that(
			page((b) => [...new Set(b.items.map((c) => c.status))].sort().join(',')),
			equals(s.split(',').sort().join(',')),
		),
		Ensure.that(
			page((b) => new Set(b.items.flatMap((c) => c.tags)).size),
			isGreaterThan(3),
		),
	),
);
Then('the page is {int} with page size {int}', (p: number, s: number) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => `${b.page}/${b.pageSize}`),
			equals(`${p}/${s}`),
		),
	),
);
Then('there are at most {int} items', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.items.length),
			not(isGreaterThan(n)),
		),
	),
);
Then('the total pages is {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.totalPages),
			equals(n),
		),
	),
);
Then('every item mentions {string}', (k: string) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.items.length > 0 && b.items.every((c) => [c.title, c.summary, ...c.tags].join(' ').toLowerCase().includes(k))),
			isTrue(),
		),
	),
);
Then('every item has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.items.length > 0 && b.items.every((c) => c.modality === m)),
			isTrue(),
		),
	),
);
Then('every item has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.items.length > 0 && b.items.every((c) => c.status === s)),
			isTrue(),
		),
	),
);
Then('every item has tag {string}', (t: string) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.items.length > 0 && b.items.every((c) => c.tags.includes(t))),
			isTrue(),
		),
	),
);
Then('the first item is {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			page((b) => b.items[0]?.id ?? ''),
			equals(id),
		),
	),
);
Then('the docs page {string} mentions {string}', async (slug: string, terms: string) => {
	const text = await readFile(new URL(`../../../../../apps/docs/docs/${slug}.md`, import.meta.url), 'utf8');
	await actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(text, includes(t))));
});
