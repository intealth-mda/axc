import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const actor = () => actorCalled('Catalog client');
When('the catalog client requests {string}', async (query: string) => {
	await actor().attemptsTo(Send.a(GetRequest.to(`/api/courses${query}`)));
});
Then('the catalog returns IDs {string} with page {int} size {int} total {int} pages {int}', async (ids: string, page: number, pageSize: number, totalItems: number, totalPages: number) => {
	assert.equal(await actor().answer(LastResponse.status()), 200);
	const body = await actor().answer(
		LastResponse.body<{
			items: { id: string; title: string; summary: string; modality: string; status: string; tags: string[]; createdAt: string; updatedAt: string }[];
			page: number;
			pageSize: number;
			totalItems: number;
			totalPages: number;
		}>(),
	);
	assert.deepEqual(
		body.items.map((c) => c.id),
		ids ? ids.split(',').map((id) => `course-${id}`) : [],
	);
	assert.deepEqual({ page: body.page, pageSize: body.pageSize, totalItems: body.totalItems, totalPages: body.totalPages }, { page, pageSize, totalItems, totalPages });
	for (const course of body.items) {
		assert.equal(typeof course.title, 'string');
		assert.equal(typeof course.summary, 'string');
		assert.ok(['online', 'in-person', 'hybrid'].includes(course.modality));
		assert.ok(['draft', 'active', 'retired'].includes(course.status));
		assert.ok(Array.isArray(course.tags));
		assert.equal(new Date(course.createdAt).toISOString(), course.createdAt);
		assert.equal(new Date(course.updatedAt).toISOString(), course.updatedAt);
	}
});
Then('the catalog rejects the query with status 400 and code INVALID_QUERY_PARAMETER', async () => {
	assert.equal(await actor().answer(LastResponse.status()), 400);
	const body = await actor().answer(LastResponse.body<{ error: { code: string; message: string; details: { field: string; message: string }[] } }>());
	assert.equal(body.error.code, 'INVALID_QUERY_PARAMETER');
	assert.equal(body.error.message, 'One or more query parameters are invalid.');
	assert.ok(body.error.details.length > 0);
});
