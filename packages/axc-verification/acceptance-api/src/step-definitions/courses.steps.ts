import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

interface CatalogResponse {
	items: { id: string }[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	error: { code: string; message: string; details: { field: string; message: string }[] };
}
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
const actor = () => actorCalled('Catalog client');
When('the catalog client requests {string}', (url: string) => actor().attemptsTo(Send.a(GetRequest.to(url))));
Then('the catalog response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(Question.about('catalog HTTP status', async (a) => await a.answer(LastResponse.status()))), equals(status))));
Then('the catalog course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('ordered course ids', async (a) => {
					const body = await a.answer(LastResponse.body<CatalogResponse>());
					return body.items.map((c) => c.id).join(',');
				}),
			),
			equals(ids),
		),
	),
);
Then('the catalog pagination is {string}', (metadata: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('pagination metadata', async (a) => {
					const b = await a.answer(LastResponse.body<CatalogResponse>());
					return [b.page, b.pageSize, b.totalItems, b.totalPages].join(',');
				}),
			),
			equals(metadata),
		),
	),
);
Then('the catalog validation field is {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('validation contract', async (a) => {
					const body = await a.answer(LastResponse.body<CatalogResponse>());
					return { code: body.error.code, message: body.error.message, fields: body.error.details.map((d) => d.field), hasMessages: body.error.details.every((d) => d.message.length > 0) };
				}),
			),
			equals({ code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', fields: [field], hasMessages: true }),
		),
	),
);
