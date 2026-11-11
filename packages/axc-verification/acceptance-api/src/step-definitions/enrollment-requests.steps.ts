import { readFile } from 'node:fs/promises';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface HistoryEntry {
	toStatus: string;
	changedBy: string;
}
interface EnrollmentRequest {
	id: string;
	status: string;
	statusHistory: HistoryEntry[];
}
interface Listing<T> {
	items: T[];
}
interface Course {
	id: string;
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const justification = 'I need this course to prepare for upcoming secure development work.';
let lastId = '';
let lastEmail = '';
let counter = 0;

const requestEnrollment = (courseId: string, learnerEmail: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification })));
const changeStatus = (status: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: 'reviewer@example.org', reason: 'Reviewed.' })));

When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));
When('a learner requests enrollment in course {string}', (courseId: string) => {
	counter += 1;
	lastEmail = `learner-${Date.now()}-${counter}@example.org`;
	return requestEnrollment(courseId, lastEmail);
});
Given('a learner has a {string} request for course {string}', async (status: string, courseId: string) => {
	counter += 1;
	lastEmail = `learner-${Date.now()}-${counter}@example.org`;
	await requestEnrollment(courseId, lastEmail);
	lastId = (await actor().answer(LastResponse.body<EnrollmentRequest>())).id;
	if (status !== 'pending') await changeStatus(status);
});
When('the same learner requests enrollment in course {string} again', (courseId: string) => requestEnrollment(courseId, lastEmail));
When('the client submits an enrollment request:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
When('the client sends a malformed enrollment request', () =>
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
When('the client lists requests with status {string}', (status: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}`))));
When('the client lists requests for that learner with status {string} on course {string}', (status: string, courseId: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${courseId}&learnerEmail=${encodeURIComponent(lastEmail)}`))),
);
When('the reviewer changes that request status with:', (json: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with(JSON.parse(json)))));

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
Then('the course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Listing<Course>) => b.items.map((c) => c.id).join(',')),
			equals(ids),
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
Then('the status history is {string}', (statuses: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => b.statusHistory.map((h) => h.toStatus).join(',')),
			equals(statuses),
		),
	),
);
Then('the last change was by {string}', (who: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => b.statusHistory.at(-1)?.changedBy ?? ''),
			equals(who),
		),
	),
);
Then('the listed requests are only that request', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Listing<EnrollmentRequest>) => b.items.map((r) => r.id).join(',')),
			equals(lastId),
		),
	),
);
Then('no requests are listed', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Listing<EnrollmentRequest>) => b.items.length),
			equals(0),
		),
	),
);
Then('the enrollment docs mention {string}', async (terms: string) => {
	const doc = await readFile(new URL('../../../../../apps/docs/docs/enrollment-requests.md', import.meta.url), 'utf8');
	await actor().attemptsTo(...terms.split(',').map((t) => Ensure.that(doc, includes(t))));
});
