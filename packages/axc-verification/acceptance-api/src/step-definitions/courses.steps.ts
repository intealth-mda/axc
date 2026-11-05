import { Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

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

interface CourseError {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

When('the client searches courses with {string}', async (query: string) => {
	await actorCalled('API client').attemptsTo(Send.a(GetRequest.to(`/api/courses${query}`)));
});

Then('the course search status is {int}', async (status: number) => {
	const received = await actorCalled('API client').answer(LastResponse.status());
	if (received !== status) {
		throw new Error(`expected status ${String(status)} received ${String(received)}`);
	}
});

Then('the course search page is {int} and page size is {int}', async (page: number, pageSize: number) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.page !== page || body.pageSize !== pageSize) {
		throw new Error(`expected page ${String(page)} and pageSize ${String(pageSize)}`);
	}
	if (body.items.length > pageSize) {
		throw new Error(`expected at most ${String(pageSize)} items`);
	}
});

Then('the course search total items is {int}', async (totalItems: number) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.totalItems !== totalItems) {
		throw new Error(`expected totalItems ${String(totalItems)} received ${String(body.totalItems)}`);
	}
});

Then('the course search total pages is {int}', async (totalPages: number) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.totalPages !== totalPages) {
		throw new Error(`expected totalPages ${String(totalPages)}`);
	}
});

Then('the course search item count is {int}', async (count: number) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.items.length !== count) {
		throw new Error(`expected ${String(count)} items received ${String(body.items.length)}`);
	}
});

Then('the course search first title is {string}', async (title: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.items[0]?.title !== title) {
		throw new Error(`expected first title ${title} received ${body.items[0]?.title ?? ''}`);
	}
});

Then('the course search second title is {string}', async (title: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.items[1]?.title !== title) {
		throw new Error(`expected second title ${title} received ${body.items[1]?.title ?? ''}`);
	}
});

Then('the course search titles are {string}, {string}, {string}, and {string}', async (first: string, second: string, third: string, fourth: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	const titles = body.items.map((item) => item.title);
	const expected = [first, second, third, fourth];
	if (titles.join('|') !== expected.join('|')) {
		throw new Error(`expected titles ${expected.join(', ')} received ${titles.join(', ')}`);
	}
});

Then('the course search titles are {string} and {string}', async (first: string, second: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	const titles = body.items.map((item) => item.title);
	const expected = [first, second];
	if (titles.join('|') !== expected.join('|')) {
		throw new Error(`expected titles ${expected.join(', ')} received ${titles.join(', ')}`);
	}
});

Then('every course modality is {string}', async (modality: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.items.some((item) => item.modality !== modality)) {
		throw new Error(`expected every modality to be ${modality}`);
	}
});

Then('every course status is {string}', async (status: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CoursePage>());
	if (body.items.some((item) => item.status !== status)) {
		throw new Error(`expected every status to be ${status}`);
	}
});

Then('the course search error field is {string}', async (field: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<CourseError>());
	if (body.error?.code !== 'INVALID_QUERY_PARAMETER') {
		throw new Error('expected INVALID_QUERY_PARAMETER');
	}
	if (!body.error.details.some((detail) => detail.field === field)) {
		throw new Error(`expected error field ${field}`);
	}
});
