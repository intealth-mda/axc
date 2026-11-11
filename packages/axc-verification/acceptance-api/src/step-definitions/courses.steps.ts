import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseItem {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

interface CoursesResponse {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CoursesErrorResponse {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

const actor = () => actorCalled('API client');

const coursesBody = () =>
	Question.about('the courses body', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CoursesResponse>());
		return body;
	});

const coursesNumber = (field: 'page' | 'pageSize' | 'totalItems' | 'totalPages') =>
	Question.about(`courses ${field}`, async (currentActor) => {
		const body = await currentActor.answer(resolved(coursesBody()));
		return body[field];
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests courses with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the courses search responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the courses page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(coursesNumber('page')), equals(page))));

Then('the courses page size is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(coursesNumber('pageSize')), equals(pageSize))));

Then('the courses total items is {int}', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(coursesNumber('totalItems')), equals(totalItems))));

Then('the courses total pages is {int}', (totalPages: number) => actor().attemptsTo(Ensure.that(resolved(coursesNumber('totalPages')), equals(totalPages))));

Then('the courses item count is {int}', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('courses item count', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					return body.items.length;
				}),
			),
			equals(count),
		),
	),
);

Then('the first course title is {string}', (title: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('first course title', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					const first = body.items[0];
					if (first === undefined) {
						return '';
					}
					return first.title;
				}),
			),
			equals(title),
		),
	),
);

Then('the first course id is {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('first course id', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					const first = body.items[0];
					if (first === undefined) {
						return '';
					}
					return first.id;
				}),
			),
			equals(id),
		),
	),
);

Then('the course ids in order are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('course ids', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					return body.items.map((item) => item.id).join(',');
				}),
			),
			equals(ids),
		),
	),
);

Then('every course modality is {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('course modalities', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					return body.items.length > 0 && body.items.every((item) => item.modality === modality);
				}),
			),
			equals(true),
		),
	),
);

Then('every course status is {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('course statuses', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					return body.items.length > 0 && body.items.every((item) => item.status === status);
				}),
			),
			equals(true),
		),
	),
);

Then('the courses are ordered by createdAt', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('createdAt order', async (currentActor) => {
					const body = await currentActor.answer(resolved(coursesBody()));
					for (let index = 1; index < body.items.length; index += 1) {
						const previous = body.items[index - 1];
						const current = body.items[index];
						if (previous === undefined || current === undefined || previous.createdAt > current.createdAt) {
							return false;
						}
					}
					return body.items.length > 1;
				}),
			),
			equals(true),
		),
	),
);

Then('the courses error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('courses error code', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursesErrorResponse>());
					return body.error.code;
				}),
			),
			equals(code),
		),
	),
);

Then('the courses error fields are {string}', (fields: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('courses error fields', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursesErrorResponse>());
					return body.error.details
						.map((detail) => detail.field)
						.sort()
						.join(',');
				}),
			),
			equals(fields),
		),
	),
);
