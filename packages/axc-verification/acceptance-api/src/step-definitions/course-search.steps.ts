import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	id: string;
	modality: string;
	status: string;
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
Then('the page is {int} with page size {int}', (p: number, s: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.page}/${b.pageSize}`),
			equals(`${p}/${s}`),
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
Then('the totals are {int} items over {int} pages', (t: number, p: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.totalItems}/${b.totalPages}`),
			equals(`${t}/${p}`),
		),
	),
);
Then('the result ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.map((c) => c.id).join(',')),
			equals(ids),
		),
	),
);
Then('every item has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => [...new Set(b.items.map((c) => c.modality))].join(',')),
			equals(m),
		),
	),
);
Then('every item has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => [...new Set(b.items.map((c) => c.status))].join(',')),
			equals(s),
		),
	),
);
Then('the result mixes {int} modalities and {int} statuses', (m: number, s: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${new Set(b.items.map((c) => c.modality)).size}/${new Set(b.items.map((c) => c.status)).size}`),
			equals(`${m}/${s}`),
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
