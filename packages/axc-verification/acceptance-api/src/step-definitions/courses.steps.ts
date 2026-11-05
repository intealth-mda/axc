import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(value: Answerable<Promise<T>>): Answerable<T> => value as unknown as Answerable<T>;
interface Course {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}
interface CatalogResult {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
const actor = () => actorCalled('Catalog client');
const bodyValue = <T>(label: string, project: (body: CatalogResult) => T) => resolved(Question.about(label, async (current) => project(await current.answer(LastResponse.body<CatalogResult>()))));
When('the catalog client requests {string}', (url: string) => actor().attemptsTo(Send.a(GetRequest.to(url))));
Then('the catalog status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the catalog ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			bodyValue('course ids', (body) => body.items.map((c) => c.id).join(',')),
			equals(ids),
		),
	),
);
Then('the catalog metadata is page {int} size {int} total {int} pages {int}', (page: number, pageSize: number, totalItems: number, totalPages: number) =>
	actor().attemptsTo(
		Ensure.that(
			bodyValue('pagination metadata', (body) => ({ page: body.page, pageSize: body.pageSize, totalItems: body.totalItems, totalPages: body.totalPages })),
			equals({ page, pageSize, totalItems, totalPages }),
		),
	),
);
Then('the catalog is sorted by {string}', (sort: 'title' | 'createdAt' | 'updatedAt') =>
	actor().attemptsTo(
		Ensure.that(
			bodyValue('ascending catalog order', (body) => body.items.length > 0 && body.items.every((course, index) => index === 0 || (body.items[index - 1]?.[sort] ?? '').localeCompare(course[sort]) <= 0)),
			equals(true),
		),
	),
);
Then('the catalog has {int} complete course records', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			bodyValue('course count', (body) => body.items.length),
			equals(count),
		),
		Ensure.that(
			bodyValue('course record fields', (body) =>
				body.items.every(
					(c) =>
						typeof c.id === 'string' &&
						c.id.length > 0 &&
						typeof c.title === 'string' &&
						c.title.length > 0 &&
						typeof c.summary === 'string' &&
						['online', 'in-person', 'hybrid'].includes(c.modality) &&
						['draft', 'active', 'retired'].includes(c.status) &&
						Array.isArray(c.tags) &&
						c.tags.every((tag) => typeof tag === 'string') &&
						new Date(c.createdAt).toISOString() === c.createdAt &&
						new Date(c.updatedAt).toISOString() === c.updatedAt,
				),
			),
			equals(true),
		),
	),
);
Then('the catalog error identifies {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog error contract', async (current) => {
					const body = await current.answer(LastResponse.body<{ error: { code: string; message: string; details: { field: string; message: string }[] } }>());
					return body.error.code === 'INVALID_QUERY_PARAMETER' && body.error.message === 'One or more query parameters are invalid.' && body.error.details.some((detail) => detail.field === field && detail.message.length > 0);
				}),
			),
			equals(true),
		),
	),
);
