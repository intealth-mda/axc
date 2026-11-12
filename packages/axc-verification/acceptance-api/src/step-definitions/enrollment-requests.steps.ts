import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, isGreaterThan, isTrue, not } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
}
interface CourseList {
	items: Course[];
	totalItems: number;
}
interface Enrollment {
	id: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string }[];
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const docs = () => readFileSync(new URL('../../../../../apps/docs/docs/enrollment-requests.md', import.meta.url), 'utf8');

let lastId = '';
let lastCourse = '';
let lastEmail = '';
const justification = 'I need this course to prepare for upcoming secure development work.';
const submit = (courseId: string, learnerEmail: string) => Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification }));
const changeTo = (status: string) => Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({ status, changedBy: 'reviewer@example.org', reason: 'Reviewed by the training team.' }));

When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));
Then('every returned course has status {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CourseList) => b.items.length > 0 && b.items.every((c) => c.status === status)),
			isTrue(),
		),
	),
);
Then('the returned courses are sorted by createdAt', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CourseList) => b.items.every((c, i, a) => i === 0 || (a[i - 1]?.createdAt ?? '') <= c.createdAt)),
			isTrue(),
		),
	),
);
Then('the total course count is at least {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CourseList) => b.totalItems),
			isGreaterThan(n - 1),
		),
	),
);
Then('the courses span at least {int} {word} values', (n: number, field: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CourseList) => new Set(b.items.flatMap((c) => (field === 'tag' ? c.tags : [field === 'modality' ? c.modality : c.status]))).size),
			isGreaterThan(n - 1),
		),
	),
);

When('the client submits a valid enrollment request for course {string}', (courseId: string) => actor().attemptsTo(submit(courseId, `learner-${Date.now()}-${Math.random()}@example.org`)));
Given('the client has submitted an enrollment request for course {string}', async (courseId: string) => {
	lastCourse = courseId;
	lastEmail = `learner-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.org`;
	await actor().attemptsTo(submit(courseId, lastEmail));
	lastId = (await actor().answer(LastResponse.body<Enrollment>())).id;
});
When('the client submits an enrollment request:', (json: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(JSON.parse(json)))));
When('the client submits the same enrollment request again', () => actor().attemptsTo(submit(lastCourse, lastEmail)));
When('the client changes that request status to {string}', (status: string) => actor().attemptsTo(changeTo(status)));
When('the client changes that request status with:', (json: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with(JSON.parse(json)))));
When('the client changes request {string} status with:', (id: string, json: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${id}/status`).with(JSON.parse(json)))));
When('the client looks up that enrollment request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up enrollment request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When('the client lists enrollment requests with status {string} for that course and learner', (status: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${lastCourse}&learnerEmail=${encodeURIComponent(lastEmail)}`))),
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
			body((b: Enrollment) => b.status),
			equals(status),
		),
	),
);
Then('the status history is {string}', (history: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Enrollment) => b.statusHistory.map((h) => `${h.fromStatus}>${h.toStatus}`).join(',')),
			equals(history),
		),
	),
);
Then('the listed requests are exactly that request', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: { items: Enrollment[] }) => b.items.map((i) => i.id).join(',')),
			equals(lastId),
		),
	),
);
Then('no requests are listed', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: { items: Enrollment[] }) => b.items.length),
			not(isGreaterThan(0)),
		),
	),
);
Then('the enrollment requests documentation mentions {string}', (item: string) => actor().attemptsTo(Ensure.that(docs().includes(item), isTrue())));
