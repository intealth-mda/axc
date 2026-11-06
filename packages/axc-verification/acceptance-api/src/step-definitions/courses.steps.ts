import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseSummary {
	id: string;
	modality: string;
	status: string;
}

interface CoursePage {
	items: CourseSummary[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CourseErrorBody {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

const actor = () => actorCalled('API client');

const pageAnswer = <T>(description: string, pick: (body: CoursePage) => T): Answerable<T> => resolved(Question.about(description, async (currentActor) => pick(await currentActor.answer(LastResponse.body<CoursePage>()))));

const errorAnswer = <T>(description: string, pick: (body: CourseErrorBody) => T): Answerable<T> =>
	resolved(Question.about(description, async (currentActor) => pick(await currentActor.answer(LastResponse.body<CourseErrorBody>()))));

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client searches the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the courses endpoint responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course page is page {int} with page size {int}', (page: number, pageSize: number) =>
	actor().attemptsTo(
		Ensure.that(
			pageAnswer('the page number', (body) => body.page),
			equals(page),
		),
		Ensure.that(
			pageAnswer('the page size', (body) => body.pageSize),
			equals(pageSize),
		),
	),
);

Then('the course page has {int} items out of {int} total in {int} pages', (items: number, totalItems: number, totalPages: number) =>
	actor().attemptsTo(
		Ensure.that(
			pageAnswer('the number of items', (body) => body.items.length),
			equals(items),
		),
		Ensure.that(
			pageAnswer('the total items', (body) => body.totalItems),
			equals(totalItems),
		),
		Ensure.that(
			pageAnswer('the total pages', (body) => body.totalPages),
			equals(totalPages),
		),
	),
);

Then('the returned course ids are {string}', (expected: string) =>
	actor().attemptsTo(
		Ensure.that(
			pageAnswer('the returned course ids', (body) => body.items.map((c) => c.id).join(', ')),
			equals(expected),
		),
	),
);

Then('every returned course has modality {string} and status {string}', (modality: string, status: string) =>
	actor().attemptsTo(
		Ensure.that(
			pageAnswer(`whether every course is ${modality} and ${status}`, (body) => body.items.every((c) => c.modality === modality && c.status === status)),
			isTrue(),
		),
	),
);

Then('the error is {string} with detail {string}: {string}', (code: string, field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(
			errorAnswer('the error code', (body) => body.error.code),
			equals(code),
		),
		Ensure.that(
			errorAnswer('the error message', (body) => body.error.message),
			equals('One or more query parameters are invalid.'),
		),
		Ensure.that(
			errorAnswer('the error details', (body) => JSON.stringify(body.error.details)),
			equals(JSON.stringify([{ field, message }])),
		),
	),
);
