import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

const justification = 'I need this course to prepare for upcoming secure development work.';

interface EnrollmentBody {
	id: string;
	status: string;
	learnerEmail: string;
	courseId: string;
	statusHistory: Array<{ fromStatus: string | null; toStatus: string }>;
}

interface ErrorBody {
	error: {
		code: string;
		details: Array<{ field: string }>;
	};
}

const actor = () => actorCalled('API client');

let lastEmail = '';
let lastCourseId = '';
let lastId = '';

function nextEmail(): string {
	return `learner-${Date.now()}-${Math.random().toString(16).slice(2)}@example.org`;
}

const statusCode = () => resolved(LastResponse.status());

const enrollmentStatus = Question.about('the enrollment status', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
	return body.status;
});

const errorCode = Question.about('the enrollment error code', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<ErrorBody>());
	return body.error.code;
});

const errorFields = Question.about('the enrollment error fields', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<ErrorBody>());
	return body.error.details
		.map((detail) => detail.field)
		.sort()
		.join(',');
});

const historyLength = Question.about('the enrollment history length', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
	return body.statusHistory.length;
});

const historyTail = Question.about('the last enrollment history status', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
	const entry = body.statusHistory[body.statusHistory.length - 1];
	return entry === undefined ? '' : entry.toStatus;
});

const historyHeadFrom = Question.about('the latest history fromStatus', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
	const entry = body.statusHistory[body.statusHistory.length - 1];
	return entry === undefined || entry.fromStatus === null ? 'null' : entry.fromStatus;
});

const listContainsLast = Question.about('whether the list contains the request', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody[]>());
	return body.some((item) => item.id === lastId);
});

async function remember(): Promise<void> {
	const body = await actor().answer(LastResponse.body<Partial<EnrollmentBody>>());
	if (typeof body.id === 'string') {
		lastId = body.id;
	}
}

When('the client creates an enrollment request for course {string}', async (courseId: string) => {
	lastEmail = nextEmail();
	lastCourseId = courseId;
	await actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId,
				learnerEmail: lastEmail,
				justification,
			}),
		),
	);
	await remember();
});

When('the client submits an enrollment request with email {string} and justification {string} for course {string}', async (learnerEmail: string, text: string, courseId: string) => {
	await actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId,
				learnerEmail,
				justification: text,
			}),
		),
	);
});

When('the client repeats the enrollment request', async () => {
	await actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId: lastCourseId,
				learnerEmail: lastEmail,
				justification,
			}),
		),
	);
});

When('the client reads the enrollment request', async () => {
	await actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${lastId}`)));
});

When('the client sets the enrollment status to {string}', async (status: string) => {
	await actor().attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({
				status,
				changedBy: 'reviewer@example.org',
			}),
		),
	);
	await remember();
});

When('the client sets the enrollment status to {string} because {string}', async (status: string, reason: string) => {
	await actor().attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${lastId}/status`).with({
				status,
				changedBy: 'reviewer@example.org',
				reason,
			}),
		),
	);
	await remember();
});

When('the client lists enrollment requests with those filters and status {string}', async (status: string) => {
	await actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${lastCourseId}&learnerEmail=${encodeURIComponent(lastEmail)}`)));
});

Then('the enrollment call responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(statusCode(), equals(status))));

Then('the enrollment request status is {string}', (status: string) => actor().attemptsTo(Ensure.that(resolved(enrollmentStatus), equals(status))));

Then('the enrollment error has status {int} and code {string}', (status: number, code: string) => actor().attemptsTo(Ensure.that(statusCode(), equals(status)), Ensure.that(resolved(errorCode), equals(code))));

Then('the enrollment error fields are {string}', (fields: string) => actor().attemptsTo(Ensure.that(resolved(errorFields), equals(fields))));

Then('the enrollment status history has {int} entries ending in {string}', (count: number, status: string) =>
	actor().attemptsTo(Ensure.that(resolved(historyLength), equals(count)), Ensure.that(resolved(historyTail), equals(status))),
);

Then('the enrollment history starts from {string}', (fromStatus: string) => actor().attemptsTo(Ensure.that(resolved(historyHeadFrom), equals(fromStatus))));

Then('the enrollment list contains the request', () => actor().attemptsTo(Ensure.that(resolved(listContainsLast), equals(true))));

Given('an enrollment request workflow is available', async () => {
	await Promise.resolve();
});
