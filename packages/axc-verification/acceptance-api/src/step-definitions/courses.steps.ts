import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CoursePageBody {
	items: Array<{ id: string }>;
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CourseErrorBody {
	error: {
		code: string;
		details: Array<{ field: string; message: string }>;
	};
}

const actor = () => actorCalled('API client');

const coursePage = Question.about('the course page', (currentActor) => currentActor.answer(LastResponse.body<CoursePageBody>()));

const courseField = <K extends 'page' | 'pageSize' | 'totalItems' | 'totalPages'>(field: K) => Question.about(`the course ${field}`, async (currentActor) => (await currentActor.answer(coursePage))[field]);

const courseItemCount = Question.about('the course item count', async (currentActor) => (await currentActor.answer(coursePage)).items.length);

const courseItemIds = Question.about('the course item ids', async (currentActor) => (await currentActor.answer(coursePage)).items.map((course) => course.id).join(','));

const courseError = Question.about('the course error', (currentActor) => currentActor.answer(LastResponse.body<CourseErrorBody>()));

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(courseField('page')), equals(page))));

Then('the course catalog page size is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(courseField('pageSize')), equals(pageSize))));

Then('the course catalog item count is {int}', (count: number) => actor().attemptsTo(Ensure.that(resolved(courseItemCount), equals(count))));

Then('the course catalog total items is {int}', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(courseField('totalItems')), equals(totalItems))));

Then('the course catalog total pages is {int}', (totalPages: number) => actor().attemptsTo(Ensure.that(resolved(courseField('totalPages')), equals(totalPages))));

Then('the course catalog item ids are {string}', (ids: string) => actor().attemptsTo(Ensure.that(resolved(courseItemIds), equals(ids))));

Then('the course catalog error code is {string}', (code: string) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the course error code', async (currentActor) => (await currentActor.answer(courseError)).error.code)), equals(code))),
);

Then('the course catalog error field {string} says {string}', (field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`the course error field ${field}`, async (currentActor) => {
					const detail = (await currentActor.answer(courseError)).error.details.find((item) => item.field === field);
					return detail?.message ?? '';
				}),
			),
			equals(message),
		),
	),
);
