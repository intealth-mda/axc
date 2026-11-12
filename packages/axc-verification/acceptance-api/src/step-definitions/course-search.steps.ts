import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isLessThan, isTrue, not } from '@serenity-js/assertions';
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
	createdAt: string;
}
interface Page {
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

When('the client searches courses with {string}', (qs: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${qs ? `?${qs}` : ''}`))));
When('the client checks course service health', () => actor().attemptsTo(Send.a(GetRequest.to('/health'))));
Then('the response status is {int}', (s: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(s))));
Then('the error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: ErrorBody) => b.error.code),
			equals(code),
		),
	),
);
Then('the error names field {string}', (f: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: ErrorBody) => b.error.details.map((d) => d.field)),
			contain(f),
		),
	),
);
Then('the total is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalItems),
			not(isLessThan(n)),
		),
	),
);
Then('the courses span {int} modalities and {int} statuses', async (m: number, s: number) => {
	await actor().attemptsTo(Send.a(GetRequest.to('/api/courses?pageSize=50')));
	await actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${new Set(b.items.map((c) => c.modality)).size}/${new Set(b.items.map((c) => c.status)).size}/${new Set(b.items.flatMap((c) => c.tags)).size > 3}`),
			equals(`${m}/${s}/true`),
		),
	);
});
Then('the page is {int} with size {int} and {int} items', (p: number, s: number, n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.page}/${b.pageSize}/${b.items.length}`),
			equals(`${p}/${s}/${n}`),
		),
	),
);
Then('the total is {int} over {int} pages', (t: number, p: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.totalItems}/${b.totalPages}`),
			equals(`${t}/${p}`),
		),
	),
);
Then('every course mentions {string}', (kw: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => [c.title, c.summary, ...c.tags].some((x) => x.toLowerCase().includes(kw)))),
			isTrue(),
		),
	),
);
Then('the course ids include {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.map((c) => c.id)),
			contain(id),
		),
	),
);
Then('the course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.map((c) => c.id).join(',')),
			equals(ids),
		),
	),
);
Then('every course has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.modality === m)),
			isTrue(),
		),
	),
);
Then('every course has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.status === s)),
			isTrue(),
		),
	),
);
Then('every course has tag {string}', (t: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.tags.some((x) => x.toLowerCase() === t))),
			isTrue(),
		),
	),
);
Then('the courses are ordered by {string}', (_f: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.map((c) => c.createdAt).every((v, i, a) => i === 0 || (a[i - 1] ?? '') <= v)),
			isTrue(),
		),
	),
);
Then('the courses doc covers {string}', (terms: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...terms.split(', ').map((t) => Ensure.that(doc, includes(t))));
});
