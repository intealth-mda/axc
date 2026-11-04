import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PostRequest, Send } from '@serenity-js/rest';

// QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface EnrollmentBody {
	id: string;
	courseId: string;
	learnerEmail: string;
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string; changedBy: string; reason: string | null }[];
}

interface CoursePage {
	items: { title: string; summary: string; modality: string; status: string; tags: string[] }[];
	totalItems: number;
}

const actor = () => actorCalled('API client');

const enrollmentField = <K extends keyof EnrollmentBody>(field: K) =>
	Question.about(`the enrollment ${field}`, async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
		return body[field];
	});

const historyCount = Question.about('the enrollment history length', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
	return body.statusHistory.length;
});

const firstHistory = Question.about('the first enrollment history entry', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
	const entry = body.statusHistory[0];
	if (entry === undefined) {
		return 'missing';
	}
	const fromStatus = entry.fromStatus ?? 'null';
	const reason = entry.reason ?? 'null';
	return `${fromStatus}|${entry.toStatus}|${entry.changedBy}|${reason}`;
});

const courseMatch = Question.about('the filtered courses', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<CoursePage>());
	if (body.totalItems !== 2 || body.items.length !== 2) {
		return `count ${body.items.length}/${body.totalItems}`;
	}
	const matches = body.items.every((course) => {
		const haystack = [course.title, course.summary, ...course.tags].join('\n').toLowerCase();
		return course.modality === 'online' && course.status === 'active' && haystack.includes('security');
	});
	return matches ? 'ok' : 'mismatch';
});

const errorCode = Question.about('the error code', async (currentActor) => {
	const body = await currentActor.answer(LastResponse.body<{ error: { code: string } }>());
	return body.error.code;
});

When('the client creates an enrollment request for the active security course', () =>
	actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId: 'course-001',
				learnerEmail: 'learner@example.org',
				justification: 'I need this course to prepare for upcoming secure development work.',
			}),
		),
	),
);

Then('the enrollment response has status 201', () => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(201))));

Then('the enrollment request is pending for course-001', () =>
	actor().attemptsTo(
		Ensure.that(resolved(enrollmentField('id')), equals('enroll-001')),
		Ensure.that(resolved(enrollmentField('courseId')), equals('course-001')),
		Ensure.that(resolved(enrollmentField('learnerEmail')), equals('learner@example.org')),
		Ensure.that(resolved(enrollmentField('status')), equals('pending')),
		Ensure.that(resolved(historyCount), equals(1)),
		Ensure.that(resolved(firstHistory), equals('null|pending|system|null')),
	),
);

When('the client searches for online active security courses', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses?q=security&modality=online&status=active'))));

Then('the course search responds with status 200', () => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(200))));

Then('the course search returns only online active security courses', () => actor().attemptsTo(Ensure.that(resolved(courseMatch), equals('ok'))));

When('the client requests courses with page size 0', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses?pageSize=0'))));

Then('the course search responds with status 400', () => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(400))));

Then('the course search error code is INVALID_QUERY_PARAMETER', () => actor().attemptsTo(Ensure.that(resolved(errorCode), equals('INVALID_QUERY_PARAMETER'))));
