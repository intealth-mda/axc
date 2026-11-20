import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, isGreaterThan, isTrue, not } from '@serenity-js/assertions';
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
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
export const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));

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
Then('the catalog holds at least {int} courses mixing modalities, statuses and tags', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.totalItems),
			isGreaterThan(n - 1),
		),
		Ensure.that(
			body((b: Page) => [new Set(b.items.map((c) => c.modality)).size, new Set(b.items.map((c) => c.status)).size, new Set(b.items.flatMap((c) => c.tags)).size > 3].join()),
			equals('3,3,true'),
		),
	),
);
Then('the page metadata is page {int} size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.page}/${b.pageSize}`),
			equals(`${page}/${size}`),
		),
	),
);
Then('no more than {int} courses are returned', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length),
			not(isGreaterThan(n)),
		),
	),
);
Then('every returned course matches keyword {string}', (k: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(k)))),
			isTrue(),
		),
	),
);
Then('every returned course has modality {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => [...new Set(b.items.map((c) => c.modality))].join()),
			equals(v),
		),
	),
);
Then('every returned course has status {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => [...new Set(b.items.map((c) => c.status))].join()),
			equals(v),
		),
	),
);
Then('every returned course has tag {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => b.items.length > 0 && b.items.every((c) => c.tags.map((t) => t.toLowerCase()).includes(v))),
			isTrue(),
		),
	),
);
Then('the courses are sorted by createdAt', () =>
	actor().attemptsTo(
		Ensure.that(
			body(
				(b: Page) =>
					b.items.map((c) => c.createdAt).join() ===
					b.items
						.map((c) => c.createdAt)
						.sort()
						.join(),
			),
			isTrue(),
		),
	),
);
Then('no courses are returned', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Page) => `${b.items.length}/${b.totalItems}`),
			equals('0/0'),
		),
	),
);
