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

interface CourseListResponse {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CourseErrorResponse {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

const actor = () => actorCalled('API client');

const courseListValue = <T>(label: string, read: (body: CourseListResponse) => T) =>
	Question.about(label, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseListResponse>());
		return read(body);
	});

const courseErrorValue = <T>(label: string, read: (body: CourseErrorResponse) => T) =>
	Question.about(label, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CourseErrorResponse>());
		return read(body);
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the courses response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the courses page is {int}', (page: number) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the courses page', (body) => body.page)), equals(page))));

Then('the courses page size is {int}', (pageSize: number) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the courses page size', (body) => body.pageSize)), equals(pageSize))));

Then('the courses total items is {int}', (totalItems: number) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the courses total items', (body) => body.totalItems)), equals(totalItems))));

Then('the courses total pages is {int}', (totalPages: number) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the courses total pages', (body) => body.totalPages)), equals(totalPages))));

Then('the courses item count is {int}', (count: number) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the courses item count', (body) => body.items.length)), equals(count))));

Then('the courses item ids are {string}', (ids: string) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the courses item ids', (body) => body.items.map((item) => item.id).join(','))), equals(ids))));

Then('every course modality is {string}', (modality: string) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the course modalities', (body) => body.items.every((item) => item.modality === modality))), equals(true))));

Then('every course status is {string}', (status: string) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the course statuses', (body) => body.items.every((item) => item.status === status))), equals(true))));

Then('every course includes tag {string}', (tag: string) =>
	actor().attemptsTo(Ensure.that(resolved(courseListValue('the course tags', (body) => body.items.every((item) => item.tags.some((itemTag) => itemTag.toLocaleLowerCase() === tag.toLocaleLowerCase())))), equals(true))),
);

Then('the courses are sorted by {string}', (field: string) => actor().attemptsTo(Ensure.that(resolved(courseListValue('the course sort order', (body) => isSortedBy(body.items, field))), equals(true))));

Then('the courses error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(courseErrorValue('the courses error code', (body) => body.error.code)), equals(code))));

Then('the courses error message is {string}', (message: string) => actor().attemptsTo(Ensure.that(resolved(courseErrorValue('the courses error message', (body) => body.error.message)), equals(message))));

Then('the courses error fields are {string}', (fields: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				courseErrorValue('the courses error fields', (body) =>
					body.error.details
						.map((detail) => detail.field)
						.sort((left, right) => compareText(left, right))
						.join(','),
				),
			),
			equals(
				fields
					.split(',')
					.sort((left, right) => compareText(left, right))
					.join(','),
			),
		),
	),
);

Then('the courses error detail for {string} is {string}', (field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				courseErrorValue('the courses error detail', (body) => {
					const detail = body.error.details.find((item) => item.field === field);
					if (detail === undefined) {
						return '';
					}
					return detail.message;
				}),
			),
			equals(message),
		),
	),
);

function isSortedBy(items: CourseItem[], field: string): boolean {
	const values = items.map((item) => readSortField(item, field));
	if (values.some((value) => value === undefined)) {
		return false;
	}
	const defined = values.filter((value): value is string => value !== undefined);
	const sorted = [...defined].sort((left, right) => compareText(left, right));
	return defined.every((value, index) => value === sorted.at(index));
}

function readSortField(item: CourseItem, field: string): string | undefined {
	if (field === 'title') {
		return item.title;
	}
	if (field === 'createdAt') {
		return item.createdAt;
	}
	if (field === 'updatedAt') {
		return item.updatedAt;
	}
	return undefined;
}

function compareText(left: string, right: string): number {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}
