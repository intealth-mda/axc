import { Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

interface EnrollmentHistoryEntry {
	fromStatus: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason: string | null;
}

interface EnrollmentBody {
	id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: EnrollmentHistoryEntry[];
}

interface EnrollmentList {
	items: EnrollmentBody[];
}

interface EnrollmentError {
	error: {
		code: string;
		message: string;
		details: { field: string; message: string }[];
	};
}

let lastEnrollmentId = '';

When('the client creates an enrollment request for course {string} learner {string} and justification {string}', async (courseId: string, learnerEmail: string, justification: string) => {
	await actorCalled('API client').attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification })));
	const status = await actorCalled('API client').answer(LastResponse.status());
	if (status === 200) {
		const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentBody>());
		lastEnrollmentId = body.id;
	}
});

When('the client reads enrollment request {string}', async (id: string) => {
	await actorCalled('API client').attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`)));
});

When('the client lists enrollment requests with {string}', async (query: string) => {
	await actorCalled('API client').attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests${query}`)));
});

When('the client updates the last enrollment request to {string} by {string} because {string}', async (status: string, changedBy: string, reason: string) => {
	await actorCalled('API client').attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${lastEnrollmentId}/status`).with({
				status,
				changedBy,
				...(reason === '' ? {} : { reason }),
			}),
		),
	);
});

When('the client updates enrollment request {string} to {string} by {string} because {string}', async (id: string, status: string, changedBy: string, reason: string) => {
	await actorCalled('API client').attemptsTo(
		Send.a(
			PatchRequest.to(`/api/enrollment-requests/${id}/status`).with({
				status,
				changedBy,
				...(reason === '' ? {} : { reason }),
			}),
		),
	);
});

Then('the enrollment response status is {int}', async (status: number) => {
	const received = await actorCalled('API client').answer(LastResponse.status());
	if (received !== status) {
		const body = await actorCalled('API client').answer(LastResponse.body<unknown>());
		throw new Error(`expected status ${String(status)} received ${String(received)} body ${JSON.stringify(body)}`);
	}
});

Then('the enrollment response status field is {string}', async (status: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentBody>());
	if (body.status !== status) {
		throw new Error(`expected status ${status} received ${body.status}`);
	}
});

Then('the enrollment response id is {string}', async (id: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentBody>());
	if (body.id !== id) {
		throw new Error(`expected id ${id} received ${body.id}`);
	}
});

Then('the enrollment history count is {int}', async (count: number) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentBody>());
	if (body.statusHistory.length !== count) {
		throw new Error(`expected history ${String(count)} received ${String(body.statusHistory.length)}`);
	}
});

Then('the enrollment history entry {int} goes to {string} from {string} by {string}', async (index: number, toStatus: string, fromStatus: string, changedBy: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentBody>());
	const entry = body.statusHistory[index - 1];
	if (!entry) {
		throw new Error(`missing history entry ${String(index)}`);
	}
	const expectedFrom = fromStatus === '' ? null : fromStatus;
	if (entry.toStatus !== toStatus || entry.fromStatus !== expectedFrom || entry.changedBy !== changedBy) {
		throw new Error(`expected history ${JSON.stringify({ toStatus, fromStatus: expectedFrom, changedBy })} received ${JSON.stringify(entry)}`);
	}
});

Then('the enrollment history entry {int} reason is {string}', async (index: number, reason: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentBody>());
	const entry = body.statusHistory[index - 1];
	if (!entry || entry.reason !== reason) {
		throw new Error(`expected reason ${reason}`);
	}
});

Then('the enrollment error code is {string}', async (code: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentError>());
	if (body.error?.code !== code) {
		throw new Error(`expected code ${code} received ${JSON.stringify(body)}`);
	}
});

Then('the enrollment error field is {string}', async (field: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentError>());
	if (!body.error.details.some((detail) => detail.field === field)) {
		throw new Error(`expected field ${field} received ${JSON.stringify(body)}`);
	}
});

Then('the enrollment list count is {int}', async (count: number) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentList>());
	if (body.items.length !== count) {
		throw new Error(`expected ${String(count)} items received ${String(body.items.length)}`);
	}
});

Then('the enrollment list contains learner {string}', async (learnerEmail: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentList>());
	if (!body.items.some((item) => item.learnerEmail === learnerEmail)) {
		throw new Error(`missing learner ${learnerEmail}`);
	}
});

Then('every listed enrollment status is {string}', async (status: string) => {
	const body = await actorCalled('API client').answer(LastResponse.body<EnrollmentList>());
	if (body.items.length === 0 || body.items.some((item) => item.status !== status)) {
		throw new Error(`expected every status ${status}`);
	}
});
