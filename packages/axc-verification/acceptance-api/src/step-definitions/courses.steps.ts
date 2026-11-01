import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseSearchBody {
	items: { id: string }[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface ErrorBody {
	error: { code: string; message: string; details: { field: string; message: string }[] };
}

const actor = () => actorCalled('API client');

const body = <T, R>(description: string, pick: (value: T) => R): Answerable<R> => resolved(Question.about(description, async (currentActor) => pick(await currentActor.answer(LastResponse.body<T>()))));

When('the client requests courses with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${query}`))));

Then('the courses endpoint responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the courses page is {int} with page size {int}, {int} total items, and {int} total pages', (page: number, pageSize: number, totalItems: number, totalPages: number) =>
	actor().attemptsTo(
		Ensure.that(
			body<CourseSearchBody, object>('the pagination metadata', (b) => ({ page: b.page, pageSize: b.pageSize, totalItems: b.totalItems, totalPages: b.totalPages })),
			equals({ page, pageSize, totalItems, totalPages }),
		),
	),
);

Then('the courses response contains {int} items', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			body<CourseSearchBody, number>('the number of items', (b) => b.items.length),
			equals(count),
		),
	),
);

Then('the returned course ids are {string}', (csv: string) =>
	actor().attemptsTo(
		Ensure.that(
			body<CourseSearchBody, string>('the returned course ids', (b) => b.items.map((c) => c.id).join(',')),
			equals(csv),
		),
	),
);

Then('the courses error envelope reports field {string} with message {string}', (field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(
			body<ErrorBody, ErrorBody>('the error body', (b) => b),
			equals({ error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: [{ field, message }] } }),
		),
	),
);
