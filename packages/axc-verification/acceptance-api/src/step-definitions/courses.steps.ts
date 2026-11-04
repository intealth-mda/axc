import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CoursePageBody {
	items: { title: string }[];
	page: number;
	pageSize: number;
	totalItems: number;
}

interface CourseErrorBody {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

const actor = () => actorCalled('API client');

const coursePage = Question.about('the course page', (currentActor) => currentActor.answer(LastResponse.body<CoursePageBody>()));

const courseField = <K extends keyof CoursePageBody>(field: K) =>
	Question.about(`the course ${field}`, async (currentActor) => {
		const body = await currentActor.answer(coursePage);
		return body[field];
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client searches courses for {string} with modality {string} and status {string}', (keyword: string, modality: string, status: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?q=${keyword}&modality=${modality}&status=${status}`))),
);

When('the client requests the course catalog with page size {int}', (pageSize: number) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?pageSize=${pageSize}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int} of size {int}', (page: number, pageSize: number) =>
	actor().attemptsTo(Ensure.that(resolved(courseField('page')), equals(page)), Ensure.that(resolved(courseField('pageSize')), equals(pageSize))),
);

Then('the course catalog contains {int} courses', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(courseField('totalItems')), equals(totalItems))));

Then('the course catalog returns {int} items', (count: number) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the course item count', async (currentActor) => (await currentActor.answer(coursePage)).items.length)), equals(count))),
);

Then('the course catalog titles are {string} and {string}', (first: string, second: string) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the course titles', async (currentActor) => (await currentActor.answer(coursePage)).items.map((item) => item.title))), equals([first, second]))),
);

Then('the course catalog error is an invalid page size', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(LastResponse.body<CourseErrorBody>()),
			equals({
				error: {
					code: 'INVALID_QUERY_PARAMETER',
					message: 'One or more query parameters are invalid.',
					details: [{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }],
				},
			}),
		),
	),
);
