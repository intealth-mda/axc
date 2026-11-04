import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, PostRequest, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

const actor = () => actorCalled('API client');
const justification = 'I need this course to prepare for upcoming secure development work.';

interface EnrollmentBody {
	status: string;
	statusHistory: { fromStatus: string | null; toStatus: string; changedBy: string }[];
}

interface CoursePageBody {
	items: { title: string; summary: string; modality: string; status: string; tags: string[] }[];
}

interface ErrorBody {
	error: { code: string; details: { field: string }[] };
}

When('the client submits an enrollment request for {string}', (courseId: string) =>
	actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId,
				learnerEmail: 'learner@example.org',
				justification,
			}),
		),
	),
);

When('the client submits an enrollment request with justification {string}', (value: string) =>
	actor().attemptsTo(
		Send.a(
			PostRequest.to('/api/enrollment-requests').with({
				courseId: 'course-001',
				learnerEmail: 'learner@example.org',
				justification: value,
			}),
		),
	),
);

When('the client searches courses with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the enrollment request is pending', () => actor().attemptsTo(Ensure.that(resolved(enrollmentIsPending()), equals(true))));

Then('the search returns {int} online active security courses', (count: number) => actor().attemptsTo(Ensure.that(resolved(matchingCourseCount(count)), equals(true))));

Then('the error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(resolved(errorCode()), equals(code))));

Then('the error field is {string}', (field: string) => actor().attemptsTo(Ensure.that(resolved(errorField()), equals(field))));

const enrollmentIsPending = () =>
	Question.about('the pending enrollment request', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<EnrollmentBody>());
		const entry = body.statusHistory[0];
		return body.status === 'pending' && body.statusHistory.length === 1 && entry?.fromStatus === null && entry.toStatus === 'pending' && entry.changedBy === 'system';
	});

const matchingCourseCount = (count: number) =>
	Question.about('matching courses', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<CoursePageBody>());
		const matches = body.items.every((course) => {
			const haystack = [course.title, course.summary, ...course.tags].join(' ').toLowerCase();
			return course.modality === 'online' && course.status === 'active' && haystack.includes('security');
		});
		return body.items.length === count && matches;
	});

const errorCode = () =>
	Question.about('the error code', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<ErrorBody>());
		return body.error.code;
	});

const errorField = () =>
	Question.about('the error field', async (currentActor) => {
		const body = await currentActor.answer(LastResponse.body<ErrorBody>());
		return body.error.details[0]?.field ?? '';
	});
