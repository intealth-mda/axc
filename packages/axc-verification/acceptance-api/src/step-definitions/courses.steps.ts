import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseItem {
	title: string;
}

interface CoursePage {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	error?: { code: string };
}

const actor = () => actorCalled('API client');

const body = () => Question.about('the course catalog body', async (currentActor) => currentActor.answer(LastResponse.body<CoursePage>()));

const pageField = <K extends 'page' | 'pageSize' | 'totalItems' | 'totalPages'>(field: K) =>
	Question.about(`the course catalog ${field}`, async (currentActor) => {
		const payload = await currentActor.answer(body());
		return payload[field];
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(pageField('page')), equals(page))));

Then('the course catalog page size is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(pageField('pageSize')), equals(pageSize))));

Then('the course catalog returns {int} items', (count: number) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the course catalog item count', async (currentActor) => (await currentActor.answer(body())).items.length)), equals(count))),
);

Then('the course catalog total items is {int}', (total: number) => actor().attemptsTo(Ensure.that(resolved(pageField('totalItems')), equals(total))));

Then('the course catalog total pages is {int}', (total: number) => actor().attemptsTo(Ensure.that(resolved(pageField('totalPages')), equals(total))));

Then('the course catalog items include {string}', (title: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`whether the catalog includes ${title}`, async (currentActor) => {
					const payload = await currentActor.answer(body());
					return payload.items.some((item) => item.title === title);
				}),
			),
			equals(true),
		),
	),
);

Then('the first course catalog title is {string}', (title: string) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the first course title', async (currentActor) => (await currentActor.answer(body())).items[0]?.title)), equals(title))),
);

Then('the course catalog error code is {string}', (code: string) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the course catalog error code', async (currentActor) => (await currentActor.answer(body())).error?.code)), equals(code))),
);
