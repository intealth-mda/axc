import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface CoursePage {
	items: { id: string; modality: string; status: string }[];
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

When('the client searches the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));
Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the page is {int} with page size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${b.page}/${b.pageSize}`),
			equals(`${page}/${size}`),
		),
	),
);
Then('the result has {int} items of {int} total', (n: number, total: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${b.items.length}/${b.totalItems}`),
			equals(`${n}/${total}`),
		),
	),
);
Then('there are {int} total pages', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.totalPages),
			equals(n),
		),
	),
);
Then('the result ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.map((c) => c.id).join(',')),
			equals(ids),
		),
	),
);
Then('every item has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.every((c) => c.modality === m)),
			equals(true),
		),
	),
);
Then('every item has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.every((c) => c.status === s)),
			equals(true),
		),
	),
);
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
Then('the courses documentation mentions {string}', async (terms: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	for (const t of terms.split(',')) await actor().attemptsTo(Ensure.that(doc, includes(t)));
});
