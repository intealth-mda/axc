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

interface CourseSearchBody {
	items: CourseRecord[];
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

const catalogNumber = (field: 'page' | 'pageSize' | 'totalItems' | 'totalPages') =>
	Question.about(`the course catalog ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body[field];
	});

const itemCount = () =>
	Question.about('the course item count', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body.items.length;
	});

const includesCourse = (id: string) =>
	Question.about(`course ${id} is present`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body.items.some((item) => item.id === id);
	});

const firstCourseId = () =>
	Question.about('the first course id', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		const first = body.items[0];
		if (first === undefined) {
			return '';
		}
		return first.id;
	});

const itemsAreEmpty = () =>
	Question.about('the course items are empty', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body.items.length === 0;
	});

const everyModality = (modality: string) =>
	Question.about(`every course modality is ${modality}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body.items.length > 0 && body.items.every((item) => item.modality === modality);
	});

const everyStatus = (status: string) =>
	Question.about(`every course status is ${status}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body.items.length > 0 && body.items.every((item) => item.status === status);
	});

const everyTag = (tag: string) =>
	Question.about(`every course contains tag ${tag}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		const needle = tag.toLocaleLowerCase('en-US');
		return body.items.length > 0 && body.items.every((item) => item.tags.some((itemTag) => itemTag.toLocaleLowerCase('en-US') === needle));
	});

const everyKeyword = (keyword: string) =>
	Question.about(`every course matches ${keyword}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return body.items.length > 0 && body.items.every((item) => containsKeyword(item, keyword));
	});

const sortedByTitle = () =>
	Question.about('courses sorted by title', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return isSorted(body.items, (item) => item.title);
	});

const sortedByCreatedAt = () =>
	Question.about('courses sorted by createdAt', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseSearchBody>());
		return isSorted(body.items, (item) => item.createdAt);
	});

const errorCode = () =>
	Question.about('the course error code', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
		return body.error.code;
	});

const errorMessage = () =>
	Question.about('the course error message', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
		return body.error.message;
	});

const errorFields = () =>
	Question.about('the course error fields', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseErrorBody>());
		return body.error.details
			.map((detail) => detail.field)
			.sort()
			.join(',');
	});

function containsKeyword(item: CourseRecord, keyword: string): boolean {
	const needle = keyword.toLocaleLowerCase('en-US');
	if (item.title.toLocaleLowerCase('en-US').includes(needle)) {
		return true;
	}
	if (item.summary.toLocaleLowerCase('en-US').includes(needle)) {
		return true;
	}
	return item.tags.some((tag) => tag.toLocaleLowerCase('en-US').includes(needle));
}

function isSorted(items: readonly CourseRecord[], value: (item: CourseRecord) => string): boolean {
	for (let index = 1; index < items.length; index += 1) {
		const previous = items[index - 1];
		const current = items[index];
		if (previous === undefined || current === undefined) {
			return false;
		}
		const previousValue = value(previous);
		const currentValue = value(current);
		if (previousValue > currentValue) {
			return false;
		}
		if (previousValue === currentValue && previous.id > current.id) {
			return false;
		}
	}
	return items.length > 0;
}

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(catalogNumber('page')), equals(page))));

Then('the course catalog pageSize is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(catalogNumber('pageSize')), equals(pageSize))));

Then('the course catalog totalItems is {int}', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(catalogNumber('totalItems')), equals(totalItems))));

Then('the course catalog totalPages is {int}', (totalPages: number) => actor().attemptsTo(Ensure.that(resolved(catalogNumber('totalPages')), equals(totalPages))));

Then('the course catalog item count is {int}', (count: number) => actor().attemptsTo(Ensure.that(resolved(itemCount()), equals(count))));

Then('the course catalog includes {string}', (id: string) => actor().attemptsTo(Ensure.that(resolved(includesCourse(id)), equals(true))));

Then('the first course id is {string}', (id: string) => actor().attemptsTo(Ensure.that(resolved(firstCourseId()), equals(id))));

Then('the course catalog items are empty', () => actor().attemptsTo(Ensure.that(resolved(itemsAreEmpty()), equals(true))));

Then('every course modality is {string}', (modality: string) => actor().attemptsTo(Ensure.that(resolved(everyModality(modality)), equals(true))));

Then('every course status is {string}', (status: string) => actor().attemptsTo(Ensure.that(resolved(everyStatus(status)), equals(true))));

Then('every course tag contains {string}', (tag: string) => actor().attemptsTo(Ensure.that(resolved(everyTag(tag)), equals(true))));

Then('every course matches keyword {string}', (keyword: string) => actor().attemptsTo(Ensure.that(resolved(everyKeyword(keyword)), equals(true))));

Then('the course catalog items are sorted by title', () => actor().attemptsTo(Ensure.that(resolved(sortedByTitle()), equals(true))));

Then('the course catalog items are sorted by createdAt', () => actor().attemptsTo(Ensure.that(resolved(sortedByCreatedAt()), equals(true))));

Then('the course catalog error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(errorCode()), equals(code))));

Then('the course catalog error message is {string}', (message: string) => actor().attemptsTo(Ensure.that(resolved(errorMessage()), equals(message))));

Then('the course catalog error fields are {string}', (fields: string) => actor().attemptsTo(Ensure.that(resolved(errorFields()), equals(fields))));
