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

interface CoursePage {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CourseErrorBody {
	error: {
		code: string;
		message: string;
		details: Array<{ field: string; message: string }>;
	};
}

const actor = () => actorCalled('API client');

const pageField = <K extends 'page' | 'pageSize' | 'totalItems' | 'totalPages'>(field: K) =>
	Question.about(`the course catalog ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CoursePage>());
		return body[field];
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(pageField('page')), equals(page))));

Then('the course catalog page size is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(pageField('pageSize')), equals(pageSize))));

Then('the course catalog total items is {int}', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(pageField('totalItems')), equals(totalItems))));

Then('the course catalog total pages is {int}', (totalPages: number) => actor().attemptsTo(Ensure.that(resolved(pageField('totalPages')), equals(totalPages))));

Then('the course catalog item count is {int}', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the course item count', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
					return body.items.length;
				}),
			),
			equals(count),
		),
	),
);

Then('the course catalog contains course {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`course ${id} is present`, async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
					return body.items.some((item) => item.id === id);
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog omits course {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`course ${id} is absent`, async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
					return body.items.some((item) => item.id === id);
				}),
			),
			equals(false),
		),
	),
);

Then('every course modality is {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('every course modality', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
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
				Question.about('every course status', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
					return body.items.length > 0 && body.items.every((item) => item.status === status);
				}),
			),
			equals(true),
		),
	),
);

Then('every course has tag {string}', (tag: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`every course has tag ${tag}`, async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
					const needle = tag.toLowerCase();
					return body.items.length > 0 && body.items.every((item) => item.tags.some((candidate) => candidate.toLowerCase() === needle));
				}),
			),
			equals(true),
		),
	),
);

Then('the courses are sorted by createdAt', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('createdAt sort order', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CoursePage>());
					const first = body.items[0];
					if (first === undefined || first.id !== 'course-005') {
						return false;
					}
					for (let index = 1; index < body.items.length; index += 1) {
						const previous = body.items[index - 1];
						const current = body.items[index];
						if (previous === undefined || current === undefined) {
							return false;
						}
						if (previous.createdAt > current.createdAt) {
							return false;
						}
					}
					return true;
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the course error code', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
					return body.error.code;
				}),
			),
			equals(code),
		),
	),
);

Then('the course catalog error fields are {string}', (fields: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the course error fields', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
					return body.error.details
						.map((detail) => detail.field)
						.sort()
						.join(',');
				}),
			),
			equals(fields.split(',').sort().join(',')),
		),
	),
);
