import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isGreaterThan, isLessThan, isTrue, not } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
interface Course {
	modality: string;
	status: string;
	tags: string[];
}
interface CoursePage {
	items: Course[];
	pageSize: number;
	totalItems: number;
}
interface History {
	fromStatus: string | null;
	toStatus: string;
}
interface Enrollment {
	id: string;
	courseId: string;
	status: string;
	statusHistory: History[];
}
interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}
const actor = () => actorCalled('API client');
const body = <B, R>(pick: (b: B) => R) => resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
const justification = 'I need this course to prepare for upcoming work.';
let lastId = '';

const create = async (email: string, courseId: string) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail: email, justification })));
	lastId = (await actor().answer(LastResponse.body<Enrollment>())).id;
};
const patch = (json: string) => actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with(JSON.parse(json))));

When('the client searches courses with {string}', (qs: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${qs}`))));
Then('every course matches modality {string} and status {string}', (m: string, s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.items.length > 0 && b.items.every((c) => c.modality === m && c.status === s)),
			isTrue(),
		),
	),
);
Then('the course page size is {int}', (n: number) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.pageSize),
			equals(n),
		),
		Ensure.that(
			body((b: CoursePage) => b.items.length),
			not(isGreaterThan(n)),
		),
	),
);
Then('the catalog holds at least 12 courses mixing every modality and status', () =>
	actor().attemptsTo(
		Ensure.that(
			body((b: CoursePage) => b.totalItems),
			not(isLessThan(12)),
		),
		Ensure.that(
			body((b: CoursePage) => new Set(b.items.map((c) => c.modality)).size * 10 + new Set(b.items.map((c) => c.status)).size),
			equals(33),
		),
		Ensure.that(
			body((b: CoursePage) => new Set(b.items.flatMap((c) => c.tags)).size),
			isGreaterThan(3),
		),
	),
);

When('learner {string} requests course {string}', (email: string, courseId: string) => actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail: email, justification }))));
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
Given('learner {string} has a pending request for course {string}', (email: string, courseId: string) => create(email, courseId));
Given('learner {string} has a approved request for course {string}', async (email: string, courseId: string) => {
	await create(email, courseId);
	await patch('{"status":"approved","changedBy":"reviewer@example.org"}');
});
When('the reviewer changes that request with:', (json: string) => patch(json));
When('the client looks up that request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`))));
When('the client looks up request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));
When('the client lists requests with {string}', (qs: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?${qs}`))));

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
Then('the request status is {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Enrollment) => b.status),
			equals(s),
		),
	),
);
Then('the history reads {string}', (h: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: Enrollment) => b.statusHistory.map((x) => `${x.fromStatus}>${x.toStatus}`).join(',')),
			equals(h),
		),
	),
);
Then('the listed requests are {string}', (s: string) =>
	actor().attemptsTo(
		Ensure.that(
			body((b: { items: Enrollment[] }) => b.items.map((r) => `${r.courseId}:${r.status}`).join(',')),
			equals(s),
		),
	),
);
Then('the enrollment requests doc lists every endpoint and error code', () => {
	const doc = readFileSync(new URL('../../../../../apps/docs/docs/enrollment-requests.md', import.meta.url), 'utf8');
	const needles = [
		'POST /api/enrollment-requests',
		'GET /api/enrollment-requests/:id',
		'GET /api/enrollment-requests',
		'PATCH /api/enrollment-requests/:id/status',
		'GET /api/courses',
		'COURSE_NOT_FOUND',
		'COURSE_NOT_ACTIVE',
		'INVALID_REQUEST',
		'DUPLICATE_ACTIVE_REQUEST',
		'ENROLLMENT_REQUEST_NOT_FOUND',
		'INVALID_STATUS_TRANSITION',
		'INVALID_QUERY_PARAMETER',
	];
	return actor().attemptsTo(...needles.map((n) => Ensure.that(doc, includes(n))));
});
