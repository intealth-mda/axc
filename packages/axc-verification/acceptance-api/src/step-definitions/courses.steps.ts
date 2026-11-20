import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, isLessThan, isTrue, not } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface CourseItem {
	id: string;
	modality: string;
	status: string;
}
interface Page {
	items: CourseItem[];
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
Then('the total is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalItems),
			not(isLessThan(n)),
		),
	),
);
Then('the page is {int} with page size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.page}/${b.pageSize}`),
			equals(`${page}/${size}`),
		),
	),
);
Then('the item count is {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length),
			equals(n),
		),
	),
);
Then('total pages is {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalPages),
			equals(n),
		),
	),
);
Then('the course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.map((i) => i.id).join(',')),
			equals(ids),
		),
	),
);
Then('every course has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((i) => i.modality === m)),
			isTrue(),
		),
	),
);
Then('every course has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((i) => i.status === s)),
			isTrue(),
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
