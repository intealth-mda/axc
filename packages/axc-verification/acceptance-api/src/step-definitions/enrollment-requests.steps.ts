import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface HistoryEntry {
	fromStatus: string | null;
	toStatus: string;
}
interface EnrollmentRequest {
	id: string;
	courseId: string;
	status: string;
	statusHistory: HistoryEntry[];
}
interface CourseList {
	items: { id: string }[];
}
interface RequestList {
	items: { courseId: string }[];
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const justification = 'I need this course to prepare for upcoming secure development work.';
let learnerEmail = '';
let lastId = '';
let n = 0;

const requestEnrollment = async (courseId: string) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification })));
	if ((await actor().answer(LastResponse.status())) === 201) lastId = (await actor().answer(LastResponse.body<EnrollmentRequest>())).id;
};
const changeStatus = (payload: object) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with(payload)));

Given('a new learner', () => {
	n += 1;
	learnerEmail = `learner-${Date.now()}-${n}@example.org`;
});
Given('the learner has a {word} request for course {string}', async (status: string, courseId: string) => {
	await requestEnrollment(courseId);
	if (status === 'approved') await changeStatus({ status, changedBy: 'reviewer@example.org' });
});
When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));
When('the learner requests enrollment in course {string}', requestEnrollment);
When('the learner submits an enrollment request:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
When('the learner submits malformed JSON', () =>
	actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests')
				.with('{bad')
				.using({ headers: { 'Content-Type': 'application/json' } }),
		),
	),
);
When('a reviewer changes that request status with:', (json: string) => changeStatus(JSON.parse(json)));
When('the client looks up that request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When("the client lists the learner's requests with status {string} in course {string}", (status: string, courseId: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${courseId}&learnerEmail=${encodeURIComponent(learnerEmail)}`))),
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
Then('the listed course ids are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CourseList) => b.items.map((i) => i.id).join(',')),
			equals(ids),
		),
	),
);
Then('the listed request courses are {string}', (ids: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: RequestList) => b.items.map((i) => i.courseId).join(',')),
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
Then('the status history is {string}', (history: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: EnrollmentRequest) => b.statusHistory.map((h) => `${h.fromStatus}>${h.toStatus}`).join(',')),
			equals(history),
		),
	),
);
Then('the enrollment requests doc mentions {string}', (terms: string) => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/enrollment-requests.md', import.meta.url), 'utf8');
	const missing = terms.split(',').filter((t) => !doc.includes(t));
	if (missing.length > 0) throw new Error(`doc is missing: ${missing.join(', ')}`);
});
