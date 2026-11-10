import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface Enrollment {
	id: string;
	courseId: string;
	learnerEmail: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string }[];
	error?: { code: string };
}

const actor = () => actorCalled('API client');
const body = () => actor().answer(LastResponse.body<Enrollment>()) as unknown as Promise<Enrollment>;
const justification = 'I need this course to prepare for upcoming secure development work.';
let seq = 0;
let last: { id: string; courseId: string; learnerEmail: string } = { id: '', courseId: '', learnerEmail: '' };

const create = async (courseId: string, learnerEmail: string, text = justification) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification: text })));
	const { id } = await body();
	last = { id, courseId, learnerEmail };
};
const change = (status: string, reason?: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${last.id}/status`).with({ status, changedBy: 'reviewer@example.org', ...(reason ? { reason } : {}) })));
const fresh = () => `learner-${Date.now()}-${++seq}@example.org`;

When('the client requests {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));
When('the client creates an enrollment request for course {string}', (courseId: string) => create(courseId, fresh()));
When('the client creates an enrollment request with email {string} and justification {string}', (email: string, text: string) => create('course-001', email, text));
When('the client creates the same enrollment request again', () => create(last.courseId, last.learnerEmail));
When('the client fetches the enrollment request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${last.id}`))));
When('the client lists enrollment requests by status {string}, the course and the learner', (status: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${last.courseId}&learnerEmail=${encodeURIComponent(last.learnerEmail)}`))),
);
When('the client changes the status to {string} with reason {string}', (status: string, reason: string) => change(status, reason));
When('the client changes the status to {string} without a reason', (status: string) => change(status));

Given('a(n) {word} enrollment request exists for course {string}', async (status: string, courseId: string) => {
	await create(courseId, fresh());
	if (status !== 'pending') await change(status, 'Seeded by the acceptance suite.');
});

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
Then('the response field {string} is {string}', (field: 'status' | 'id', value: string) => actor().attemptsTo(Ensure.that(resolved(Question.about(field, async () => (await body())[field])), equals(value))));
Then('the error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(Question.about('error code', async () => (await body()).error?.code)), equals(code))));
Then('the status history has {int} entries', (n: number) => actor().attemptsTo(Ensure.that(resolved(Question.about('history length', async () => (await body()).statusHistory.length)), equals(n))));
Then('the last history entry goes from {string} to {string}', (from: string, to: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('last transition', async () => {
					const e = (await body()).statusHistory.at(-1);
					return `${e?.fromStatus}->${e?.toStatus}`;
				}),
			),
			equals(`${from}->${to}`),
		),
	),
);
Then('the list holds only the enrollment request', () =>
	actor().attemptsTo(Ensure.that(resolved(Question.about('listed ids', async () => ((await body()) as unknown as Enrollment[]).map((r) => r.id).join(','))), equals(last.id))),
);
Then('the docs page {string} mentions {string}', (page: string, text: string) => actor().attemptsTo(Ensure.that(readFileSync(`../../../apps/docs/docs/${page}.md`, 'utf8'), includes(text))));
