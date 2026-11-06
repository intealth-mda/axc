import { Before, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface StatusHistoryEntry {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

interface EnrollmentRequestBody {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryEntry[];
}

interface EnrollmentListBody {
	items: EnrollmentRequestBody[];
}

interface EnrollmentErrorBody {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

const actor = () => actorCalled('API client');

let enrollmentRequestId = '';

Before(() => {
	enrollmentRequestId = '';
});

When('the client creates an enrollment request for course {string} as {string} with justification {string}', async (courseId: string, learnerEmail: string, justification: string) => {
	const api = actor();
	await api.attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId,
				learnerEmail,
				justification,
			}),
		),
	);
	const status = await api.answer(LastResponse.status());
	if (status !== 201) {
		return;
	}
	const body = await api.answer(LastResponse.body<EnrollmentRequestBody>());
	enrollmentRequestId = body.id;
});

When('the client reads the enrollment request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${currentEnrollmentRequestId()}`))));

When('the client reads enrollment request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));

When('the client lists enrollment requests with query {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?${query}`))));

When('the client sets the enrollment request status to {string} as {string}', (status: string, changedBy: string) =>
	actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${currentEnrollmentRequestId()}/status`).with({ status, changedBy }))),
);

When('the client rejects the enrollment request as {string} because {string}', (changedBy: string, reason: string) =>
	actor().attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${currentEnrollmentRequestId()}/status`).with({
				status: 'rejected',
				changedBy,
				reason,
			}),
		),
	),
);

Then('the enrollment response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the enrollment error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the enrollment error code', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentErrorBody>()));
					return body.error.code;
				}),
			),
			equals(code),
		),
	),
);

Then('the enrollment error includes field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the enrollment error field', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentErrorBody>()));
					return body.error.details.some((detail) => detail.field === field);
				}),
			),
			equals(true),
		),
	),
);

Then('the enrollment request status value is {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the enrollment status', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentRequestBody>()));
					return body.status;
				}),
			),
			equals(status),
		),
	),
);

Then('the enrollment history has {int} entries', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the enrollment history length', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentRequestBody>()));
					return body.statusHistory.length;
				}),
			),
			equals(count),
		),
	),
);

Then('the first enrollment history entry is the initial pending entry', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the initial history entry', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentRequestBody>()));
					const entry = body.statusHistory[0];
					return entry?.fromStatus === null && entry.toStatus === 'pending' && entry.changedBy === 'system' && entry.reason === null;
				}),
			),
			equals(true),
		),
	),
);

Then('the last enrollment history reason is {string}', (reason: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the last history reason', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentRequestBody>()));
					return body.statusHistory.at(-1)?.reason ?? '';
				}),
			),
			equals(reason),
		),
	),
);

Then('the enrollment list includes learner {string}', (learnerEmail: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the filtered learner', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentListBody>()));
					return body.items.some((item) => item.learnerEmail.toLocaleLowerCase() === learnerEmail.toLocaleLowerCase());
				}),
			),
			equals(true),
		),
	),
);

Then('the enrollment list has {int} requests', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the enrollment list size', async (currentActor) => {
					const body = await currentActor.answer(resolved(LastResponse.body<EnrollmentListBody>()));
					return body.items.length;
				}),
			),
			equals(count),
		),
	),
);

function currentEnrollmentRequestId(): string {
	if (enrollmentRequestId.length === 0) {
		throw new Error('No enrollment request has been created in this scenario.');
	}
	return enrollmentRequestId;
}
