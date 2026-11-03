import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CoursePageBody {
	items: { id: string }[];
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

const courseField = <K extends keyof CoursePageBody>(field: K) =>
	Question.about(`the course ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CoursePageBody>());
		return body[field];
	});

const itemCount = Question.about('the course item count', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CoursePageBody>());
	return body.items.length;
});

const onlyCourseId = Question.about('the only course id', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CoursePageBody>());
	return body.items[0]?.id ?? '';
});

const errorField = Question.about('the course error field', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
	return body.error.details[0]?.field ?? '';
});

const errorDetailMessage = Question.about('the course error detail', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
	return body.error.details[0]?.message ?? '';
});

const errorCode = Question.about('the course error code', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
	return body.error.code;
});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog returns page {int} of size {int} from {int} courses', (page: number, pageSize: number, totalItems: number) =>
	actor().attemptsTo(
		Ensure.that(resolved(courseField('page')), equals(page)),
		Ensure.that(resolved(courseField('pageSize')), equals(pageSize)),
		Ensure.that(resolved(courseField('totalItems')), equals(totalItems)),
		Ensure.that(resolved(courseField('totalPages')), equals(Math.ceil(totalItems / pageSize))),
		Ensure.that(resolved(itemCount), equals(Math.min(pageSize, totalItems))),
	),
);

Then('the course catalog returns only course {string}', (id: string) =>
	actor().attemptsTo(Ensure.that(resolved(courseField('totalItems')), equals(1)), Ensure.that(resolved(itemCount), equals(1)), Ensure.that(resolved(onlyCourseId), equals(id))),
);

Then('the course catalog error names field {string} with message {string}', (field: string, message: string) =>
	actor().attemptsTo(Ensure.that(resolved(errorCode), equals('INVALID_QUERY_PARAMETER')), Ensure.that(resolved(errorField), equals(field)), Ensure.that(resolved(errorDetailMessage), equals(message))),
);
