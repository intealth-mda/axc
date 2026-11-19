import { randomUUID } from 'node:crypto';
import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface EnrollmentRequest {
	id: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string }[];
}
const actor = () => actorCalled('API client');
const body = <R>(pick: (b: EnrollmentRequest) => R) => resolved(Question.about('the request', async (a) => pick(await a.answer(LastResponse.body<EnrollmentRequest>()))));
const justification = 'I need this course for upcoming secure development work.';
let email = '';
let courseId = '';
let lastId = '';

const create = async (course: string) => {
	courseId = course;
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail: email, justification })));
};
const change = (status: string, reason: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: 'reviewer@example.org', ...(reason ? { reason } : {}) })));

When('a learner requests course {string}', async (course: string) => {
	email = `${randomUUID()}@example.org`;
	await create(course);
});
Given('a learner has a {string} request for course {string}', async (status: string, course: string) => {
	email = `${randomUUID()}@example.org`;
	await create(course);
	lastId = (await actor().answer(LastResponse.body<EnrollmentRequest>())).id;
	if (status !== 'pending') {
		if (status === 'cancelled') await change('approved', '');
		await change(status, '');
	}
});
When('the same learner requests that course again', () => create(courseId));
When('the client submits an enrollment request:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
When('the client looks up that request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When("the client lists that learner's requests with status {string} for course {string}", (status: string, course: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${course}&learnerEmail=${encodeURIComponent(email)}`))),
);
When('the reviewer changes that request to {string} with reason {string}', (status: string, reason: string) => change(status, reason));
Then('the request status is {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b) => b.status),
			equals(status),
		),
	),
);
Then('the history is {string}', (h: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b) => b.statusHistory.map((e) => `${e.fromStatus}>${e.toStatus}`).join(',')),
			equals(h),
		),
	),
);
Then('the listed ids are just that request', () =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('ids', async (a) => (await a.answer(LastResponse.body<EnrollmentRequest[]>())).map((r) => r.id).join(','))), equals(lastId))),
);
