import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

// shortcut: step state is process-global, upgrade if acceptance scenarios run in parallel
let enrollmentId = '';

const actor = () => actorCalled('API client');

const responseField = (field: string) =>
	Question.about(`response ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<Record<string, string>>());
		return body[field] ?? '';
	});

const historyLength = Question.about('status history length', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<{ statusHistory: unknown[] }>());
	return body.statusHistory.length;
});

const courseIds = Question.about('course ids', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<{ items: { id: string }[] }>());
	return body.items.map((item) => item.id).join(',');
});

const errorCode = Question.about('error code', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<{ error: { code: string } }>());
	return body.error.code;
});

When('the client searches courses with q {string}, modality {string}, and status {string}', (q: string, modality: string, status: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?q=${q}&modality=${modality}&status=${status}`))),
);

When('the client searches courses with pageSize {string}', (pageSize: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?pageSize=${pageSize}`))));

When('the client creates an enrollment request for {string}', (courseId: string) =>
	actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId,
				learnerEmail: 'learner@example.org',
				justification: 'I need this course to prepare for upcoming secure development work.',
			}),
		),
	),
);

When('the client approves the enrollment request', async () => {
	const body = await actor().answer(LastResponse.body<{ id: string }>());
	enrollmentId = body.id;
	await actor().attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${enrollmentId}/status`).with({
				status: 'approved',
				changedBy: 'reviewer@example.org',
			}),
		),
	);
});

When('the client reads the enrollment request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${enrollmentId}`))));

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course search returns only {string}', (id: string) => actor().attemptsTo(Ensure.that(resolved(courseIds), equals(id))));

Then('the enrollment request is pending for {string}', (courseId: string) =>
	actor().attemptsTo(Ensure.that(resolved(responseField('status')), equals('pending')), Ensure.that(resolved(responseField('courseId')), equals(courseId)), Ensure.that(resolved(historyLength), equals(1))),
);

Then('the enrollment request status history has {int} entries', (count: number) => actor().attemptsTo(Ensure.that(resolved(historyLength), equals(count))));

Then('the error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(errorCode), equals(code))));
