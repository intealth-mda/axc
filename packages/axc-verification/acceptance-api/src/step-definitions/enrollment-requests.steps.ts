import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface EnrollmentRequestBody {
	id: string;
	courseId: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string; changedBy: string; reason: string | null }[];
}

interface EnrollmentListBody {
	items: { id: string; courseId: string; status: string }[];
}

interface EnrollmentErrorBody {
	error: {
		code: string;
		details: { field: string; message: string }[];
	};
}

let currentRequestId = '';

const actor = () => actorCalled('API client');

const responseStatus = Question.about('the enrollment response status', async (currentActor) => currentActor.answer(resolved(LastResponse.status())));

const requestStatus = Question.about('the enrollment request status', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentRequestBody>());
	return body.status;
});

const historyCount = Question.about('the enrollment history count', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentRequestBody>());
	return body.statusHistory.length;
});

const firstHistory = Question.about('the first enrollment history entry', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentRequestBody>());
	const entry = body.statusHistory[0];
	if (entry === undefined) {
		return '';
	}
	const fromStatus = entry.fromStatus === null ? 'null' : entry.fromStatus;
	return `${fromStatus}|${entry.toStatus}|${entry.changedBy}`;
});

const lastReason = Question.about('the last enrollment history reason', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentRequestBody>());
	return body.statusHistory.at(-1)?.reason ?? '';
});

const listCount = Question.about('the enrollment list count', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentListBody>());
	return body.items.length;
});

const listCourses = Question.about('the enrollment list courses', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentListBody>());
	return body.items.map((item) => item.courseId).join(',');
});

const errorCode = Question.about('the enrollment error code', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentErrorBody>());
	return body.error.code;
});

const errorDetail = (field: string) =>
	Question.about(`the enrollment ${field} error`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<EnrollmentErrorBody>());
		return body.error.details.find((detail) => detail.field === field)?.message ?? '';
	});

When('the client creates an enrollment request for course {string} as {string} with justification {string}', async (courseId: string, learnerEmail: string, justification: string) => {
	await actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId,
				learnerEmail,
				justification,
			}),
		),
	);
	const status = await actor().answer(resolved(LastResponse.status()));
	if (status === 201) {
		const body = await actor().answer(LastResponse.body<EnrollmentRequestBody>());
		currentRequestId = body.id;
	}
});

When('the client fetches the current enrollment request', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${currentRequestId}`))));

When('the client fetches enrollment request {string}', (id: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`))));

When('the client lists enrollment requests with status {string}, course {string}, and learner {string}', (status: string, courseId: string, learnerEmail: string) =>
	actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=${status}&courseId=${courseId}&learnerEmail=${encodeURIComponent(learnerEmail)}`))),
);

When('the client sets the current enrollment request status to {string} as {string}', (status: string, changedBy: string) =>
	actor().attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${currentRequestId}/status`).with({
				status,
				changedBy,
			}),
		),
	),
);

When('the client rejects the current enrollment request as {string} because {string}', (changedBy: string, reason: string) =>
	actor().attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${currentRequestId}/status`).with({
				status: 'rejected',
				changedBy,
				reason,
			}),
		),
	),
);

Then('the enrollment response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(responseStatus), equals(status))));

Then('the enrollment request status is {string}', (status: string) => actor().attemptsTo(Ensure.that(resolved(requestStatus), equals(status))));

Then('the enrollment status history has {int} entries', (count: number) => actor().attemptsTo(Ensure.that(resolved(historyCount), equals(count))));

Then('the first enrollment history entry goes from null to {string} by {string}', (toStatus: string, changedBy: string) => actor().attemptsTo(Ensure.that(resolved(firstHistory), equals(`null|${toStatus}|${changedBy}`))));

Then('the last enrollment history reason is {string}', (reason: string) => actor().attemptsTo(Ensure.that(resolved(lastReason), equals(reason))));

Then('the enrollment list has {int} items', (count: number) => actor().attemptsTo(Ensure.that(resolved(listCount), equals(count))));

Then('the enrollment list contains course {string}', (courseId: string) => actor().attemptsTo(Ensure.that(resolved(listCourses), equals(courseId))));

Then('the enrollment error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(errorCode), equals(code))));

Then('the enrollment error detail for {string} is {string}', (field: string, message: string) => actor().attemptsTo(Ensure.that(resolved(errorDetail(field)), equals(message))));
