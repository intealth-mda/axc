import { readFile } from 'node:fs/promises';
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
	updatedAt: string;
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
let docText = '';

When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${query ? `?${query}` : ''}`))));
When('the client reads the courses documentation', async () => {
	docText = await readFile(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
});
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
Then('the pagination is page {int} size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.page}:${b.pageSize}`),
			equals(`${page}:${size}`),
		),
	),
);
Then('the result has {int} items', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length),
			equals(n),
		),
	),
);
Then('the total is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalItems),
			isGreaterThan(n - 1),
		),
	),
);
Then('the results span modalities {string} and statuses {string}', (m: string, s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => [...new Set(b.items.map((c) => c.modality))].sort().join(',')),
			equals(m),
		),
		Ensure.that(
			body((b: Page) => [...new Set(b.items.map((c) => c.status))].sort().join(',')),
			equals(s),
		),
		Ensure.that(
			body((b: Page) => new Set(b.items.flatMap((c) => c.tags)).size > 5),
			isTrue(),
		),
	),
);
Then('every result mentions {string}', (kw: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => [c.title, c.summary, ...c.tags].some((x) => x.toLowerCase().includes(kw)))),
			isTrue(),
		),
	),
);
Then('the result ids include {string}', (ids: string) =>
	actor().attemptsTo(
		...ids.split(',').map((id) =>
			Ensure.that(
				body((b: Page) => b.items.map((c) => c.id)),
				contain(id),
			),
		),
	),
);
Then('every result has {word} {string}', (field: string, value: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => (field === 'tag' ? c.tags.map((t) => t.toLowerCase()).includes(value) : (field === 'modality' ? c.modality : c.status) === value))),
			isTrue(),
		),
	),
);
Then('the total pages match the total items for page size {int}', (size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalPages === Math.ceil(b.totalItems / size)),
			isTrue(),
		),
	),
);
Then('the results are ordered by {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.every((c, i, a) => i === 0 || (a[i - 1]?.[field === 'createdAt' ? 'createdAt' : 'updatedAt'] ?? '') <= c[field === 'createdAt' ? 'createdAt' : 'updatedAt'])),
			isTrue(),
		),
	),
);
Then('the docs mention {string}', (terms: string) => actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(docText, includes(t)))));
