import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseListing {
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
	items: CourseListing[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CourseQueryErrorResponse {
	error: {
		code: string;
		message: string;
		details: Array<{ field: string; message: string }>;
	};
}

const actor = () => actorCalled('API client');

const catalogField = <K extends 'page' | 'pageSize' | 'totalItems' | 'totalPages'>(field: K) =>
	Question.about(`the course catalog ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		return body[field];
	});

const itemCount = () =>
	Question.about('the course catalog item count', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		return body.items.length;
	});

const firstCourseId = () =>
	Question.about('the first course id', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		const first = body.items[0];
		if (first === undefined) {
			return '';
		}
		return first.id;
	});

const containsCourse = (id: string) =>
	Question.about(`the catalog contains ${id}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		return body.items.some((item) => item.id === id);
	});

const itemsMatchKeyword = (keyword: string) =>
	Question.about(`items match ${keyword}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		if (body.items.length === 0) {
			return false;
		}
		const needle = keyword.toLowerCase();
		return body.items.every((item) => {
			const inTitle = item.title.toLowerCase().includes(needle);
			const inSummary = item.summary.toLowerCase().includes(needle);
			const inTags = item.tags.some((tag) => tag.toLowerCase().includes(needle));
			return inTitle || inSummary || inTags;
		});
	});

const everyModality = (modality: string) =>
	Question.about(`every course modality is ${modality}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		if (body.items.length === 0) {
			return false;
		}
		return body.items.every((item) => item.modality === modality);
	});

const everyStatus = (status: string) =>
	Question.about(`every course status is ${status}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		if (body.items.length === 0) {
			return false;
		}
		return body.items.every((item) => item.status === status);
	});

const everyTag = (tag: string) =>
	Question.about(`every course has tag ${tag}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		if (body.items.length === 0) {
			return false;
		}
		const needle = tag.toLowerCase();
		return body.items.every((item) => item.tags.some((itemTag) => itemTag.toLowerCase() === needle));
	});

const createdAtSorted = () =>
	Question.about('courses are sorted by createdAt', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseCatalogPage>());
		if (body.items.length === 0) {
			return false;
		}
		const dates = body.items.map((item) => item.createdAt);
		const sorted = [...dates].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
		return dates.every((value, index) => {
			const expected = sorted[index];
			return expected !== undefined && value === expected;
		});
	});

const errorCode = () =>
	Question.about('the course catalog error code', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseQueryErrorResponse>());
		return body.error.code;
	});

const errorMessage = () =>
	Question.about('the course catalog error message', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseQueryErrorResponse>());
		return body.error.message;
	});

const errorFields = () =>
	Question.about('the course catalog error fields', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseQueryErrorResponse>());
		return body.error.details
			.map((detail) => detail.field)
			.sort()
			.join(',');
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(catalogField('page')), equals(page))));

Then('the course catalog page size is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(catalogField('pageSize')), equals(pageSize))));

Then('the course catalog item count is {int}', (count: number) => actor().attemptsTo(Ensure.that(resolved(itemCount()), equals(count))));

Then('the course catalog total items is {int}', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(catalogField('totalItems')), equals(totalItems))));

Then('the course catalog total pages is {int}', (totalPages: number) => actor().attemptsTo(Ensure.that(resolved(catalogField('totalPages')), equals(totalPages))));

Then('the first course id is {string}', (id: string) => actor().attemptsTo(Ensure.that(resolved(firstCourseId()), equals(id))));

Then('the course catalog contains course {string}', (id: string) => actor().attemptsTo(Ensure.that(resolved(containsCourse(id)), equals(true))));

Then('every course matches keyword {string}', (keyword: string) => actor().attemptsTo(Ensure.that(resolved(itemsMatchKeyword(keyword)), equals(true))));

Then('every course has modality {string}', (modality: string) => actor().attemptsTo(Ensure.that(resolved(everyModality(modality)), equals(true))));

Then('every course has status {string}', (status: string) => actor().attemptsTo(Ensure.that(resolved(everyStatus(status)), equals(true))));

Then('every course has tag {string}', (tag: string) => actor().attemptsTo(Ensure.that(resolved(everyTag(tag)), equals(true))));

Then('the courses are sorted by createdAt', () => actor().attemptsTo(Ensure.that(resolved(createdAtSorted()), equals(true))));

Then('the course catalog error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(errorCode()), equals(code))));

Then('the course catalog error message is {string}', (message: string) => actor().attemptsTo(Ensure.that(resolved(errorMessage()), equals(message))));

Then('the course catalog error fields are {string}', (fields: string) => actor().attemptsTo(Ensure.that(resolved(errorFields()), equals(fields))));
