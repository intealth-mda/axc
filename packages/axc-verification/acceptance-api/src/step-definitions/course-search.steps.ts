import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isGreaterThan, isTrue } from '@serenity-js/assertions';
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

When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));
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
Then('the total course count is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalItems),
			isGreaterThan(n - 1),
		),
	),
);
Then('the courses span {int} modalities and {int} statuses', (m: number, s: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => new Set(b.items.map((c) => c.modality)).size),
			equals(m),
		),
		Ensure.that(
			body((b: Page) => new Set(b.items.map((c) => c.status)).size),
			equals(s),
		),
		Ensure.that(
			body((b: Page) => new Set(b.items.flatMap((c) => c.tags)).size > 5),
			isTrue(),
		),
	),
);
Then('the page is {int} of size {int} with {int} items', (page: number, size: number, n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.page}/${b.pageSize}/${b.items.length}`),
			equals(`${page}/${size}/${n}`),
		),
	),
);
Then('the total is {int} courses over {int} pages', (total: number, pages: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.totalItems}/${b.totalPages}/${b.items.length === Math.min(b.pageSize, Math.max(0, total - (b.page - 1) * b.pageSize))}`),
			equals(`${total}/${pages}/true`),
		),
	),
);
Then('every course mentions {string}', (word: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => [c.title, c.summary, ...c.tags].join(' ').toLowerCase().includes(word))),
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
Then('every course has modality {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.modality === v)),
			isTrue(),
		),
	),
);
Then('every course has status {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.status === v)),
			isTrue(),
		),
	),
);
Then('every course has tag {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.tags.some((t) => t.toLowerCase() === v))),
			isTrue(),
		),
	),
);
Then('the courses are ordered by {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => {
				const vals = b.items.map((c) => (field === 'createdAt' ? c.createdAt : c.title));
				return vals.length > 1 && vals.every((v, i) => i === 0 || (vals[i - 1] ?? '') <= v);
			}),
			isTrue(),
		),
	),
);
Then('the courses doc mentions {string}, {string}, {string} and {string}', (a: string, b: string, c: string, d: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...[a, b, c, d].map((s) => Ensure.that(doc, includes(s))));
});
