import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, notes, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface HistoryEntry {
	fromStatus: string | null;
	toStatus: string;
	changedBy: string;
}

interface EnrollmentRequest {
	id: string;
	status: string;
	statusHistory: HistoryEntry[];
}

interface ErrorBody {
	error: { code: string };
}

interface EnrollmentNotes {
	requestId: string;
}

const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';

const actor = () => actorCalled('API client');

const fromBody = <B, T>(description: string, pick: (body: B) => T) => Question.about(description, async (currentActor) => pick(await currentActor.answer(LastResponse.body<B>())));

const requestId = () => actor().answer(notes<EnrollmentNotes>().get('requestId'));

When('learner {string} requests enrollment in course {string}', async (learnerEmail: string, courseId: string) => {
	await actor().attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with({ courseId, learnerEmail, justification: JUSTIFICATION })));
	const body = await actor().answer(LastResponse.body<Partial<EnrollmentRequest>>());
	if (body.id !== undefined) {
		await actor().attemptsTo(notes<EnrollmentNotes>().set('requestId', body.id));
	}
});

When('reviewer {string} changes the enrollment request status to {string}', async (changedBy: string, status: string) => {
	const id = await requestId();
	await actor().attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${id}/status`).with({ status, changedBy })));
});

When('the client fetches the enrollment request', async () => {
	const id = await requestId();
	await actor().attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${id}`)));
});

Then('the enrollment API responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then(/^the enrollment request has status "([^"]*)" and (\d+) history entr(?:y|ies)$/, (status: string, count: string) =>
	actor().attemptsTo(
		Ensure.that(resolved(fromBody('the request status', (body: EnrollmentRequest) => body.status)), equals(status)),
		Ensure.that(resolved(fromBody('the history length', (body: EnrollmentRequest) => body.statusHistory.length)), equals(Number(count))),
	),
);

Then('history entry {int} moved from {string} to {string} by {string}', (position: number, fromStatus: string, toStatus: string, changedBy: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				fromBody(`history entry ${position}`, (body: EnrollmentRequest) => {
					const entry = body.statusHistory[position - 1];
					return entry && { fromStatus: entry.fromStatus, toStatus: entry.toStatus, changedBy: entry.changedBy };
				}),
			),
			equals({ fromStatus, toStatus, changedBy }),
		),
	),
);

Then('the enrollment error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(fromBody('the error code', (body: ErrorBody) => body.error.code)), equals(code))));
