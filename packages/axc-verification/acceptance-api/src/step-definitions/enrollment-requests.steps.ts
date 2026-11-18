import { readFile } from 'node:fs/promises';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isGreaterThan, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	modality: string;
	status: string;
}
interface CoursePage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
}
interface Enrollment {
	id: string;
	courseId: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string }[];
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const uniq = (xs: string[]) => [...new Set(xs)].sort().join(',');
let lastId = '';
let docText = '';

const create = (learnerEmail: string, courseId: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification: 'I need this course for upcoming project work.' })));
const move = async (status: string, reason?: string) => {
	await actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: 'reviewer@example.org', reason: reason ?? 'Reviewed by acceptance test.' })));
};

When('the client searches courses with {string}', (qs: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${qs}`))));
When('the learner {string} requests course {string}', (email: string, courseId: string) => create(email, courseId));
Given('the learner {string} has a {word} request for course {string}', async (email: string, status: string, courseId: string) => {
	await create(email, courseId);
	lastId = (await actor().answer(LastResponse.body<Enrollment>())).id;
	if (status !== 'pending') await move(status);
});
When('the client submits an enrollment request:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
When('the client submits malformed JSON', () =>
	actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests')
				.with('{bad')
				.using({ headers: { 'Content-Type': 'application/json' } }),
		),
	),
);
When('the client looks up that request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When('the client lists requests with {string}', (qs: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?${qs}`))));
When('the reviewer moves that request through {string}', async (path: string) => {
	for (const s of path.split(',')) await move(s);
});
When('the reviewer changes that request status with:', (json: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with(JSON.parse(json)))));
When('the reader opens the enrollment requests documentation', async () => {
	docText = await readFile(new URL('../../../../../apps/docs/docs/enrollment-requests.md', import.meta.url), 'utf8');
});

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: ErrorBody) => b.error.code),
			equals(code),
		),
	),
);
Then('the error names field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: ErrorBody) => b.error.details.map((d) => d.field)),
			contain(field),
		),
	),
);
Then('at least {int} courses are returned', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length),
			isGreaterThan(n - 1),
		),
	),
);
Then('the courses cover modalities {string} and statuses {string}', (modalities: string, statuses: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${uniq(b.items.map((c) => c.modality))}|${uniq(b.items.map((c) => c.status))}`),
			equals(`${modalities}|${statuses}`),
		),
	),
);
Then('every returned course has status {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length > 0 && b.items.every((c) => c.status === status)),
			isTrue(),
		),
	),
);
Then('the page metadata is page {int} of size {int}', (page: number, size: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => `${b.page}/${b.pageSize}/${b.items.length <= size}`),
			equals(`${page}/${size}/true`),
		),
	),
);
Then('the request status is {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Enrollment) => b.status),
			equals(status),
		),
	),
);
Then('the status history is {string}', (history: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Enrollment) => b.statusHistory.map((h) => `${h.fromStatus ?? ''}:${h.toStatus}`).join(',')),
			equals(history),
		),
	),
);
Then('the listed requests are {string}', (list: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: { items: Enrollment[] }) => b.items.map((e) => `${e.courseId}:${e.status}`).join(',')),
			equals(list),
		),
	),
);
Then('it mentions {string}', (terms: string) => actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(docText, includes(t)))));
