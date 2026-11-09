import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

interface CoursePage {
	items: { id: string }[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
const actor = () => actorCalled('Catalog client');
When('the catalog client requests {string}', (url: string) => actor().attemptsTo(Send.a(GetRequest.to(url))));
Then('the catalog status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the catalog ids are {string}', async (ids: string) => {
	const body = await actor().answer(LastResponse.body<CoursePage>());
	await actor().attemptsTo(Ensure.that(body.items.map((item) => item.id).join(','), equals(ids)));
});
Then('the catalog pagination is {int}, {int}, {int}, {int}', async (page: number, pageSize: number, totalItems: number, totalPages: number) => {
	const body = await actor().answer(LastResponse.body<CoursePage>());
	await actor().attemptsTo(Ensure.that({ page: body.page, pageSize: body.pageSize, totalItems: body.totalItems, totalPages: body.totalPages }, equals({ page, pageSize, totalItems, totalPages })));
});
Then('the catalog error identifies {string}', async (field: string) => {
	const body = await actor().answer(LastResponse.body<{ error: { code: string; message: string; details: { field: string; message: string }[] } }>());
	await actor().attemptsTo(
		Ensure.that(body.error.code, equals('INVALID_QUERY_PARAMETER')),
		Ensure.that(body.error.message, equals('One or more query parameters are invalid.')),
		Ensure.that(
			body.error.details.some((detail) => detail.field === field && detail.message.length > 0),
			equals(true),
		),
	);
});
