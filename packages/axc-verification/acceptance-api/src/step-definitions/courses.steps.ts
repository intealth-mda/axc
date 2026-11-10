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

interface CourseQueryErrorBody {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

const actor = () => actorCalled('API client');

const coursePage = () => Question.about('the course page', (currentActor) => currentActor.answer(LastResponse.body<CoursePage>()));

const courseError = () => Question.about('the course error', (currentActor) => currentActor.answer(LastResponse.body<CourseQueryErrorBody>()));

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the page number', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.page;
				}),
			),
			equals(page),
		),
	),
);

Then('the course catalog page size is {int}', (pageSize: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the page size', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.pageSize;
				}),
			),
			equals(pageSize),
		),
	),
);

Then('the course catalog total items is {int}', (totalItems: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the total items', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.totalItems;
				}),
			),
			equals(totalItems),
		),
	),
);

Then('the course catalog total pages is {int}', (totalPages: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the total pages', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.totalPages;
				}),
			),
			equals(totalPages),
		),
	),
);

Then('the course catalog item count is {int}', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the item count', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.items.length;
				}),
			),
			equals(count),
		),
	),
);

Then('the course catalog first item id is {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the first course id', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					const first = body.items[0];
					return first === undefined ? '' : first.id;
				}),
			),
			equals(id),
		),
	),
);

Then('every course catalog item has modality {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the modalities', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.items.every((item) => item.modality === modality);
				}),
			),
			equals(true),
		),
	),
);

Then('every course catalog item has status {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the statuses', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					return body.items.every((item) => item.status === status);
				}),
			),
			equals(true),
		),
	),
);

Then('every course catalog item has tag {string}', (tag: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the tags', async (currentActor) => {
					const expected = tag.toLocaleLowerCase('en');
					const body = await currentActor.answer(coursePage());
					return body.items.every((item) => item.tags.some((itemTag) => itemTag.toLocaleLowerCase('en') === expected));
				}),
			),
			equals(true),
		),
	),
);

Then('every course catalog item matches keyword {string}', (keyword: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the keyword matches', async (currentActor) => {
					const term = keyword.toLocaleLowerCase('en');
					const body = await currentActor.answer(coursePage());
					return body.items.every((item) => {
						const haystack = [item.title, item.summary, ...item.tags].join('\n').toLocaleLowerCase('en');
						return haystack.includes(term);
					});
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog items are sorted by createdAt', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('createdAt order', async (currentActor) => {
					const body = await currentActor.answer(coursePage());
					const stamps = body.items.map((item) => item.createdAt);
					const ordered = [...stamps].sort((left, right) => {
						if (left < right) {
							return -1;
						}
						if (left > right) {
							return 1;
						}
						return 0;
					});
					return stamps.join('|') === ordered.join('|');
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
				Question.about('the error code', async (currentActor) => {
					const body = await currentActor.answer(courseError());
					return body.error.code;
				}),
			),
			equals(code),
		),
	),
);

Then('the course catalog error message is {string}', (message: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the error message', async (currentActor) => {
					const body = await currentActor.answer(courseError());
					return body.error.message;
				}),
			),
			equals(message),
		),
	),
);

Then('the course catalog error fields are {string}', (csv: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the error fields', async (currentActor) => {
					const body = await currentActor.answer(courseError());
					return body.error.details
						.map((detail) => detail.field)
						.sort()
						.join(',');
				}),
			),
			equals(csv.split(',').sort().join(',')),
		),
	),
);
