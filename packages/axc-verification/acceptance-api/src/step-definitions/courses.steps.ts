import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseRecord {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

interface CourseCatalogPage {
	items: CourseRecord[];
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

const catalog = Question.about('the course catalog', async (currentActor) => currentActor.answer(LastResponse.body<CourseCatalogPage>()));

const catalogError = Question.about('the course catalog error', async (currentActor) => currentActor.answer(LastResponse.body<CourseQueryErrorBody>()));

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(Question.about('the page', async (currentActor) => (await currentActor.answer(catalog)).page)), equals(page))));

Then('the course catalog page size is {int}', (pageSize: number) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the page size', async (currentActor) => (await currentActor.answer(catalog)).pageSize)), equals(pageSize))),
);

Then('the course catalog total items are {int}', (totalItems: number) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the total items', async (currentActor) => (await currentActor.answer(catalog)).totalItems)), equals(totalItems))),
);

Then('the course catalog total pages are {int}', (totalPages: number) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the total pages', async (currentActor) => (await currentActor.answer(catalog)).totalPages)), equals(totalPages))),
);

Then('the course catalog item count is {int}', (count: number) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the item count', async (currentActor) => (await currentActor.answer(catalog)).items.length)), equals(count))),
);

Then('the course catalog item ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the course ids', async (currentActor) => {
					const body = await currentActor.answer(catalog);
					return body.items.map((item) => item.id).join(',');
				}),
			),
			equals(ids),
		),
	),
);

Then('the first course id is {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the first course id', async (currentActor) => {
					const body = await currentActor.answer(catalog);
					return body.items[0]?.id ?? '';
				}),
			),
			equals(id),
		),
	),
);

Then('every course modality is {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the modalities', async (currentActor) => {
					const body = await currentActor.answer(catalog);
					return body.items.every((item) => item.modality === modality);
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
				Question.about('the statuses', async (currentActor) => {
					const body = await currentActor.answer(catalog);
					return body.items.every((item) => item.status === status);
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
				Question.about('the tags', async (currentActor) => {
					const needle = tag.toLowerCase();
					const body = await currentActor.answer(catalog);
					return body.items.every((item) => item.tags.some((itemTag) => itemTag.toLowerCase() === needle));
				}),
			),
			equals(true),
		),
	),
);

Then('every course matches {string}', (keyword: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the keyword matches', async (currentActor) => {
					const needle = keyword.toLowerCase();
					const body = await currentActor.answer(catalog);
					return body.items.every((item) => item.title.toLowerCase().includes(needle) || item.summary.toLowerCase().includes(needle) || item.tags.some((tag) => tag.toLowerCase().includes(needle)));
				}),
			),
			equals(true),
		),
	),
);

Then('the courses are sorted by {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the sort order', async (currentActor) => {
					const body = await currentActor.answer(catalog);
					const values = body.items.map((item) => (field === 'createdAt' ? item.createdAt : field === 'updatedAt' ? item.updatedAt : item.title));
					return values.join('|') === [...values].sort().join('|');
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog error code is {string}', (code: string) =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('the error code', async (currentActor) => (await currentActor.answer(catalogError)).error.code)), equals(code))),
);

Then('the course catalog error includes field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the error fields', async (currentActor) => {
					const body = await currentActor.answer(catalogError);
					return body.error.details.some((detail) => detail.field === field);
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog error message for {string} is {string}', (field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the error message', async (currentActor) => {
					const body = await currentActor.answer(catalogError);
					const detail = body.error.details.find((item) => item.field === field);
					return detail?.message ?? '';
				}),
			),
			equals(message),
		),
	),
);
