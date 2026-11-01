import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CoursePage {
	items: { id: string; modality: string }[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface ErrorBody {
	error: { code: string; message: string; details: { field: string; message: string }[] };
}

const actor = () => actorCalled('API client');

const fromBody = <B, T>(description: string, pick: (body: B) => T) => Question.about(description, async (currentActor) => pick(await currentActor.answer(LastResponse.body<B>())));

When('the client requests the course catalog with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(query === '' ? '/api/courses' : `/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course page is page {int} of size {int} with {int} total items and {int} items', (page: number, pageSize: number, totalItems: number, itemCount: number) =>
	actor().attemptsTo(
		Ensure.that(resolved(fromBody('the page', (body: CoursePage) => body.page)), equals(page)),
		Ensure.that(resolved(fromBody('the page size', (body: CoursePage) => body.pageSize)), equals(pageSize)),
		Ensure.that(resolved(fromBody('the total items', (body: CoursePage) => body.totalItems)), equals(totalItems)),
		Ensure.that(resolved(fromBody('the item count', (body: CoursePage) => body.items.length)), equals(itemCount)),
	),
);

Then('every returned course has modality {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(resolved(fromBody('whether any course was returned', (body: CoursePage) => body.items.length > 0)), isTrue()),
		Ensure.that(resolved(fromBody(`whether every course is ${modality}`, (body: CoursePage) => body.items.every((course) => course.modality === modality))), isTrue()),
	),
);

Then('the error lists field {string} with message {string}', (field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(resolved(fromBody('the error code', (body: ErrorBody) => body.error.code)), equals('INVALID_QUERY_PARAMETER')),
		Ensure.that(resolved(fromBody('the error message', (body: ErrorBody) => body.error.message)), equals('One or more query parameters are invalid.')),
		Ensure.that(resolved(fromBody('the error details', (body: ErrorBody) => body.error.details)), equals([{ field, message }])),
	),
);
