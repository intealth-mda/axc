import { readFileSync } from 'node:fs';
import { type DataTable, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals } from '@serenity-js/assertions';
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
type SortField = 'title' | 'createdAt' | 'updatedAt';
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const everyItem = (test: (c: Course) => boolean) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length > 0 && b.items.every(test)),
			equals(true),
		),
	);

When('the client searches the catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${query}`))));
Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the pagination is page {int} of size {int} with {int} total courses', (page: number, size: number, total: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${b.page}/${b.pageSize}/${b.totalItems}/${b.totalPages}`),
			equals(`${page}/${size}/${total}/${Math.ceil(total / size)}`),
		),
	),
);
Then('the page holds at most {int} courses', (max: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length <= max),
			equals(true),
		),
	),
);
Then('every returned course mentions {string}', (word: string) => everyItem((c) => [c.title, c.summary, ...c.tags].some((t) => t.toLowerCase().includes(word))));
Then('every returned course has modality {string}', (m: string) => everyItem((c) => c.modality === m));
Then('every returned course has status {string}', (s: string) => everyItem((c) => c.status === s));
Then('every returned course has tag {string}', (tag: string) => everyItem((c) => c.tags.some((t) => t.toLowerCase() === tag)));
Then('the courses are ordered by {string}', (field: SortField) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length > 1 && b.items.every((c, i, all) => i === 0 || (all[i - 1]?.[field] ?? '') <= c[field])),
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
Then('the courses documentation mentions each of:', (table: DataTable) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/courses.md', import.meta.url), 'utf8');
	const missing = table
		.raw()
		.flat()
		.filter((term) => !doc.includes(term));
	return actor().attemptsTo(Ensure.that(missing.join(','), equals('')));
});
