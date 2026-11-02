import { AfterAll, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';
import { stopMemoryMongo } from '../infrastructure.ts';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseItem {
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
	error?: { code: string; details: { field: string }[] };
}

const field = <T>(name: string, read: (body: CoursePage) => T): Answerable<T> => Question.about(name, async (actor) => read((await actor.answer(LastResponse.body())) as CoursePage)) as unknown as Answerable<T>;

When('the client requests course search courses', () => actorCalled('API client').attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests course search courses with {string}', (query: string) => actorCalled('API client').attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('course search courses responds with status {int}', (status: number) => actorCalled('API client').attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course page is {int}', (page: number) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('page', (body) => body.page),
			equals(page),
		),
	),
);

Then('the course page size is {int}', (pageSize: number) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('page size', (body) => body.pageSize),
			equals(pageSize),
		),
	),
);

Then('the course item count is {int}', (count: number) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('item count', (body) => body.items.length),
			equals(count),
		),
	),
);

Then('the course total item count is {int}', (count: number) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('total items', (body) => body.totalItems),
			equals(count),
		),
	),
);

Then('the course total page count is {int}', (count: number) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('total pages', (body) => body.totalPages),
			equals(count),
		),
	),
);

Then('the courses are sorted by title', () =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('title order', (body) => [...body.items.map((item) => item.title)].sort((left, right) => left.localeCompare(right)).join('|')),
			equals(field('titles', (body) => body.items.map((item) => item.title).join('|'))),
		),
	),
);

Then('the courses are sorted by createdAt', () =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('created order', (body) => [...body.items.map((item) => item.createdAt)].sort((left, right) => left.localeCompare(right)).join('|')),
			equals(field('created times', (body) => body.items.map((item) => item.createdAt).join('|'))),
		),
	),
);

Then('every course matches {string}', (keyword: string) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('keyword matches', (body) => body.items.every((item) => `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase().includes(keyword.toLowerCase()))),
			equals(true),
		),
	),
);

Then('every course modality is {string}', (modality: string) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('modalities', (body) => body.items.every((item) => item.modality === modality)),
			equals(true),
		),
	),
);

Then('every course status is {string}', (status: string) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('statuses', (body) => body.items.every((item) => item.status === status)),
			equals(true),
		),
	),
);

Then('every course tag includes {string}', (tag: string) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('tags', (body) => body.items.every((item) => item.tags.some((itemTag) => itemTag.toLowerCase() === tag.toLowerCase()))),
			equals(true),
		),
	),
);

Then('the course error code is {string}', (code: string) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('error code', (body) => body.error?.code),
			equals(code),
		),
	),
);

Then('the course error field is {string}', (name: string) =>
	actorCalled('API client').attemptsTo(
		Ensure.that(
			field('error field', (body) => body.error?.details.some((detail) => detail.field === name)),
			equals(true),
		),
	),
);

AfterAll(() => stopMemoryMongo());
