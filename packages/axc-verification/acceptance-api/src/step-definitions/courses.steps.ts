import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CoursePage {
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

const pageField = (field: keyof Pick<CoursePage, 'page' | 'pageSize' | 'totalItems' | 'totalPages'>) =>
	Question.about(`the courses ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CoursePage>());
		return body[field];
	});

const itemCount = Question.about('the courses item count', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CoursePage>());
	return body.items.length;
});

const itemIds = Question.about('the courses item ids', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CoursePage>());
	return body.items.map((item) => item.id).join(',');
});

const firstItemId = Question.about('the first course id', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CoursePage>());
	return body.items[0]?.id ?? '';
});

const errorCode = Question.about('the courses error code', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
	return body.error.code;
});

const errorDetail = (field: string) =>
	Question.about(`the courses ${field} error`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
		return body.error.details.find((detail) => detail.field === field)?.message ?? '';
	});

When('the client requests courses at {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the courses response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the courses page reports page {int}, pageSize {int}, totalItems {int}, and totalPages {int}', (page: number, pageSize: number, totalItems: number, totalPages: number) =>
	actor().attemptsTo(
		Ensure.that(resolved(pageField('page')), equals(page)),
		Ensure.that(resolved(pageField('pageSize')), equals(pageSize)),
		Ensure.that(resolved(pageField('totalItems')), equals(totalItems)),
		Ensure.that(resolved(pageField('totalPages')), equals(totalPages)),
	),
);

Then('the courses page contains {int} items', (count: number) => actor().attemptsTo(Ensure.that(resolved(itemCount), equals(count))));

Then('the courses item ids are {string}', (ids: string) => actor().attemptsTo(Ensure.that(resolved(itemIds), equals(ids))));

Then('the courses item ids start with {string}', (id: string) => actor().attemptsTo(Ensure.that(resolved(firstItemId), equals(id))));

Then('the courses error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(errorCode), equals(code))));

Then('the courses error detail for {string} is {string}', (field: string, message: string) => actor().attemptsTo(Ensure.that(resolved(errorDetail(field)), equals(message))));
