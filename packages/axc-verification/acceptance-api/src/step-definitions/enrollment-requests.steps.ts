import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	id: string;
	modality: string;
	status: string;
	tags: string[];
}
interface CoursePage {
	items: Course[];
	totalItems: number;
}
interface EnrollmentRequest {
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
const run = Date.now().toString(36);
const email = (learner: string) => `${learner}.${run}@example.org`;
let lastId = '';

const request = async (learner: string, courseId: string) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail: email(learner), justification: 'I need this course for my upcoming project work.' })));
	if ((await actor().answer(LastResponse.status())) === 201) lastId = (await actor().answer(LastResponse.body<EnrollmentRequest>())).id;
};
const change = (status: string, reason?: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: 'reviewer@example.org', ...(reason ? { reason } : {}) })));

Given('learner {string} has requested course {string}', request);
When('learner {string} requests course {string}', request);
When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));
When('the client submits an enrollment request:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
Given('a reviewer changes that request to {string}', async (status: string) => {
	if (status !== 'pending') await change(status);
});
When('a reviewer rejects that request to {string} with reason {string}', (status: string, reason: string) => change(status, reason));
When('the client looks up that request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When('the client lists requests with status {string}', (status: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}`))));
When('the client lists requests for learner {string} on course {string} with status {string}', (learner: string, courseId: string, status: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${courseId}&learnerEmail=${encodeURIComponent(email(learner))}`))),
);

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
Then('the request status is {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => b.status),
			equals(status),
		),
	),
);
Then('the status history reads {string}', (history: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => b.statusHistory.map((h) => `${h.fromStatus}>${h.toStatus}`).join(',')),
			equals(history),
		),
	),
);
Then('the listed courses are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: { items: EnrollmentRequest[] }) => b.items.map((r) => r.courseId).join(',')),
			equals(ids),
		),
	),
);
Then('the course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.map((c) => c.id).join(',')),
			equals(ids),
		),
	),
);
Then('at least {int} courses span {int} modalities, {int} statuses and {int} tags', (count: number, modalities: number, statuses: number, tags: number) =>
	actor().attemptsTo(
		Ensure.that(
			body(
				(b: CoursePage) => b.totalItems >= count && new Set(b.items.map((c) => c.modality)).size === modalities && new Set(b.items.map((c) => c.status)).size === statuses && new Set(b.items.flatMap((c) => c.tags)).size >= tags,
			),
			isTrue(),
		),
	),
);
Then('the {string} doc mentions {string}', async (page: string, terms: string) => {
	const text = readFileSync(resolve(process.cwd(), '../../../apps/docs/docs', `${page}.md`), 'utf8');
	await actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(text, includes(t))));
});
