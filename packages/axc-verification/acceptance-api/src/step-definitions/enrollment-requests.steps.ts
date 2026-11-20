import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';
import { body } from './course-search.steps.ts';

interface EnrollmentRequest {
	id: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string }[];
}
const actor = () => actorCalled('API client');
let lastId = '';
let lastEmail = '';
const freshEmail = () => {
	lastEmail = `learner-${Date.now()}-${Math.random().toString(36).slice(2)}@example.org`;
	return lastEmail;
};
const submit = (courseId: string, learnerEmail: string) =>
	actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification: 'I need this course for upcoming secure development work.' })));
const patch = (payload: object) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with(payload)));

Given('a learner has a request for course {string} moved to {string}', async (courseId: string, status: string) => {
	await submit(courseId, freshEmail());
	lastId = (await actor().answer(LastResponse.body<EnrollmentRequest>())).id;
	if (status === 'approved' || status === 'cancelled') await patch({ status, changedBy: 'reviewer@example.org' });
});
When('a new learner submits a request for course {string}', (courseId: string) => submit(courseId, freshEmail()));
When('the same learner submits another request for course {string}', (courseId: string) => submit(courseId, lastEmail));
When('the client submits a request with:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
When('the client looks up that request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When('the client lists requests for that learner on course {string} with status {string}', (courseId: string, status: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${courseId}&learnerEmail=${encodeURIComponent(lastEmail)}`))),
);
When('the reviewer changes that request with:', (json: string) => patch(JSON.parse(json)));
Then('the request status is {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => b.status),
			equals(status),
		),
	),
);
Then('the status history is {string}', (history: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => [String(b.statusHistory[0]?.fromStatus), ...b.statusHistory.map((h) => h.toStatus)].join('>')),
			equals(history),
		),
	),
);
Then('the list holds only that request', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest[]) => b.map((r) => r.id).join()),
			equals(lastId),
		),
	),
);
