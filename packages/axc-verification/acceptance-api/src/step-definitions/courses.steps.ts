import { readFileSync } from 'node:fs';
import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseItem {
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
}
interface CoursesBody {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	error: { code: string; details: { field: string }[] };
}

const actor = () => actorCalled('API client');
const body = <T>(description: string, pick: (b: CoursesBody) => T) => resolved(Question.about(description, async (a) => pick(await a.answer(LastResponse.body<CoursesBody>()))));

When('the client requests {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the courses response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the courses page is {int} with page size {int} and {int} total items', (page: number, pageSize: number, total: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('page', (b) => b.page),
			equals(page),
		),
		Ensure.that(
			body('pageSize', (b) => b.pageSize),
			equals(pageSize),
		),
		Ensure.that(
			body('totalItems', (b) => b.totalItems),
			equals(total),
		),
	),
);

Then('there are {int} course items', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('item count', (b) => b.items.length),
			equals(n),
		),
	),
);

Then('total pages is {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body('totalPages', (b) => b.totalPages),
			equals(n),
		),
	),
);

Then('every course mentions {string}', (word: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('every item mentions', (b) => b.items.every((c) => [c.title, c.summary, ...c.tags].some((s) => s.toLowerCase().includes(word)))),
			isTrue(),
		),
	),
);

Then('every course has modality {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('modalities', (b) => b.items.every((c) => c.modality === v)),
			isTrue(),
		),
	),
);

Then('every course has status {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('statuses', (b) => b.items.every((c) => c.status === v)),
			isTrue(),
		),
	),
);

Then('every course has tag {string}', (v: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('tags', (b) => b.items.every((c) => c.tags.some((t) => t.toLowerCase() === v))),
			isTrue(),
		),
	),
);

Then('the courses are sorted by {string}', (field: 'createdAt') =>
	actor().attemptsTo(
		Ensure.that(
			body('sorted', (b) => b.items.every((c, i, all) => i === 0 || (all[i - 1]?.[field] ?? '') <= c[field])),
			isTrue(),
		),
	),
);

Then('the error code is {string} for field {string}', (code: string, field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body('error code', (b) => b.error.code),
			equals(code),
		),
		Ensure.that(
			body('error field', (b) => b.error.details.map((d) => d.field).join(',')),
			equals(field),
		),
	),
);

Then('the courses documentation mentions {string}, {string}, {string}, {string}', (a: string, b: string, c: string, d: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	return actor().attemptsTo(...[a, b, c, d].map((w) => Ensure.that(doc, includes(w))));
});
