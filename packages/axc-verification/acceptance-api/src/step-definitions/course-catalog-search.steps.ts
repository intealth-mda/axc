import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isGreaterThan, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	id: string;
	modality: string;
	status: string;
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
let docs = '';

When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${query ? `?${query}` : ''}`))));
When('the client reads the courses documentation', () => {
	docs = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
});
Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the total is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.totalItems),
			isGreaterThan(n - 1),
		),
	),
);
Then('the courses include every modality and status', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => [...new Set(b.items.map((c) => c.modality))].sort().join()),
			equals('hybrid,in-person,online'),
		),
		Ensure.that(
			body((b: CoursePage) => [...new Set(b.items.map((c) => c.status))].sort().join()),
			equals('active,draft,retired'),
		),
	),
);
Then('the page is {int} with page size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${b.page}/${b.pageSize}`),
			equals(`${page}/${size}`),
		),
	),
);
Then('there are {int} courses', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length),
			equals(n),
		),
	),
);
Then('the total is {int} over {int} pages', (total: number, pages: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${b.totalItems}/${b.totalPages}`),
			equals(`${total}/${pages}`),
		),
	),
);
Then('the course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.map((c) => c.id).join()),
			equals(ids),
		),
	),
);
Then('every course has modality {string}', (m: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length > 0 && b.items.every((c) => c.modality === m)),
			isTrue(),
		),
	),
);
Then('every course has status {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length > 0 && b.items.every((c) => c.status === s)),
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
Then('the docs mention {string}', (text: string) => actor().attemptsTo(Ensure.that(docs, includes(text))));
