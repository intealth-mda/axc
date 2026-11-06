import { EnrollmentRequest, InvalidEnrollmentTransitionError } from '@axc/domain';
import { createEnrollmentRequestStore, createSeededCourseCatalog } from '@axc/persistence';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createEnrollmentRequest,
	type EnrollmentCommandResult,
	type EnrollmentErrorBody,
	type EnrollmentListResult,
	type EnrollmentRequestDependencies,
	getEnrollmentRequest,
	listEnrollmentRequests,
	updateEnrollmentRequestStatus,
} from './enrollment-requests.ts';
import { buildApplicationServicesFactory } from './index.ts';

const justification = 'I need this course to prepare for upcoming secure development work.';
const createdAt = '2026-06-27T10:00:00.000Z';
const reviewedAt = '2026-06-27T11:00:00.000Z';

function dependencies(now: () => string = () => createdAt): EnrollmentRequestDependencies {
	return {
		courseCatalog: createSeededCourseCatalog(),
		enrollmentRequests: createEnrollmentRequestStore(),
		now,
	};
}

function sequenceClock(times: readonly string[]): () => string {
	let index = 0;
	return () => {
		const value = times[index] ?? times[times.length - 1] ?? createdAt;
		if (index < times.length) {
			index += 1;
		}
		return value;
	};
}

let deps: EnrollmentRequestDependencies;

beforeEach(() => {
	deps = dependencies();
});

function createBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		courseId: 'course-001',
		learnerEmail: 'learner@example.org',
		justification,
		...overrides,
	};
}

async function create(body: unknown = createBody()): Promise<EnrollmentCommandResult> {
	return await createEnrollmentRequest(deps, body);
}

function expectFailure(result: EnrollmentCommandResult | EnrollmentListResult): EnrollmentErrorBody {
	expect(result.ok).toBe(false);
	if (result.ok) {
		throw new Error('expected an enrollment error');
	}
	return result.body;
}

describe('enrollment requests', () => {
	it('creates a pending request with the initial status history entry', async () => {
		const result = await create();

		expect(result).toEqual({
			ok: true,
			status: 201,
			body: {
				id: 'enroll-001',
				courseId: 'course-001',
				learnerEmail: 'learner@example.org',
				justification,
				status: 'pending',
				createdAt,
				updatedAt: createdAt,
				statusHistory: [
					{
						fromStatus: null,
						toStatus: 'pending',
						changedAt: createdAt,
						changedBy: 'system',
						reason: null,
					},
				],
			},
		});
	});

	it('trims the email and justification before storing them', async () => {
		const result = await create(createBody({ learnerEmail: '  Learner@Example.org  ', justification: `  ${justification}  ` }));

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.body.learnerEmail).toBe('Learner@Example.org');
		expect(result.body.justification).toBe(justification);
	});

	it('accepts a justification of 20 and 500 characters', async () => {
		const short = await create(createBody({ learnerEmail: 'short@example.org', justification: 'a'.repeat(20) }));
		const long = await create(createBody({ learnerEmail: 'long@example.org', justification: 'b'.repeat(500) }));

		expect(short.ok).toBe(true);
		expect(long.ok).toBe(true);
	});

	it('returns 404 when the course does not exist', async () => {
		const result = await create(createBody({ courseId: 'course-missing' }));
		const error = expectFailure(result);

		expect(result.status).toBe(404);
		expect(error).toEqual({
			error: {
				code: 'COURSE_NOT_FOUND',
				message: 'The course does not exist.',
				details: [{ field: 'courseId', message: 'No course exists with this id.' }],
			},
		});
	});

	it('returns 409 when the course is draft or retired', async () => {
		const draft = await create(createBody({ courseId: 'course-003' }));
		const retired = await create(createBody({ courseId: 'course-004', learnerEmail: 'other@example.org' }));

		expect(draft.status).toBe(409);
		expect(expectFailure(draft).error.code).toBe('COURSE_NOT_ACTIVE');
		expect(retired.status).toBe(409);
		expect(expectFailure(retired).error.code).toBe('COURSE_NOT_ACTIVE');
	});

	it('returns 400 for an invalid email and a short justification', async () => {
		const result = await create(createBody({ learnerEmail: 'not-an-email', justification: 'too short' }));
		const error = expectFailure(result);

		expect(result.status).toBe(400);
		expect(error).toEqual({
			error: {
				code: 'INVALID_REQUEST',
				message: 'The request could not be completed.',
				details: [
					{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' },
					{ field: 'justification', message: 'justification must be between 20 and 500 characters.' },
				],
			},
		});
	});

	it('returns 400 before looking up a course when the body is invalid', async () => {
		const result = await create({ courseId: 'course-missing', learnerEmail: 'not-an-email', justification: 'too short' });

		expect(result.status).toBe(400);
		expect(expectFailure(result).error.code).toBe('INVALID_REQUEST');
	});

	it('returns 400 for a missing body, a non-object body, and a justification that is too long', async () => {
		const missing = await create(null);
		const arrayBody = await create([]);
		const tooLong = await create(createBody({ justification: 'c'.repeat(501) }));

		expect(expectFailure(missing).error.details).toEqual([{ field: 'body', message: 'Request body must be a JSON object.' }]);
		expect(expectFailure(arrayBody).error.details).toEqual([{ field: 'body', message: 'Request body must be a JSON object.' }]);
		expect(tooLong.status).toBe(400);
		expect(expectFailure(tooLong).error.details).toEqual([{ field: 'justification', message: 'justification must be between 20 and 500 characters.' }]);
	});

	it('ignores unknown create fields', async () => {
		const result = await create(createBody({ note: 'optional context' }));

		expect(result.status).toBe(201);
	});

	it('rejects a second pending request for the same learner and course', async () => {
		expect((await create()).status).toBe(201);
		const duplicate = await create(createBody({ learnerEmail: 'LEARNER@example.org' }));

		expect(duplicate.status).toBe(409);
		expect(expectFailure(duplicate)).toEqual({
			error: {
				code: 'DUPLICATE_ACTIVE_REQUEST',
				message: 'An active enrollment request already exists for this learner and course.',
				details: [{ field: 'learnerEmail', message: 'A pending or approved request already exists for this course.' }],
			},
		});
	});

	it('rejects a second request when the first is approved', async () => {
		const created = await create();
		await updateEnrollmentRequestStatus(deps, createdId(created), { status: 'approved', changedBy: 'reviewer@example.org' });
		const duplicate = await create();

		expect(duplicate.status).toBe(409);
		expect(expectFailure(duplicate).error.code).toBe('DUPLICATE_ACTIVE_REQUEST');
	});

	it('allows another learner, another course, and a new request after rejection or cancellation', async () => {
		const first = await create();
		const otherLearner = await create(createBody({ learnerEmail: 'other@example.org' }));
		const otherCourse = await create(createBody({ courseId: 'course-002' }));
		await updateEnrollmentRequestStatus(deps, createdId(first), { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Prerequisite is missing from the learner record.' });
		const afterRejection = await create();
		await updateEnrollmentRequestStatus(deps, createdId(afterRejection), { status: 'cancelled', changedBy: 'learner@example.org' });
		const afterCancellation = await create();

		expect(otherLearner.status).toBe(201);
		expect(otherCourse.status).toBe(201);
		expect(afterRejection.status).toBe(201);
		expect(afterCancellation.status).toBe(201);
	});

	it('returns a request by id, including status history', async () => {
		const created = await create();
		const result = await getEnrollmentRequest(deps, createdId(created));

		expect(result.status).toBe(200);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.body.id).toBe('enroll-001');
			expect(result.body.statusHistory).toHaveLength(1);
		}
	});

	it('returns 404 when the request id does not exist', async () => {
		const result = await getEnrollmentRequest(deps, 'enroll-404');

		expect(result.status).toBe(404);
		expect(expectFailure(result).error.code).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
	});

	it('filters requests by status, courseId, and learnerEmail', async () => {
		await create(createBody({ learnerEmail: 'ada@example.org' }));
		const approved = await create(createBody({ learnerEmail: 'bea@example.org', courseId: 'course-002' }));
		await updateEnrollmentRequestStatus(deps, createdId(approved), { status: 'approved', changedBy: 'reviewer@example.org' });
		await create(createBody({ learnerEmail: 'ada@example.org', courseId: 'course-005' }));

		const byStatus = await listEnrollmentRequests(deps, { status: 'approved' });
		const byCourse = await listEnrollmentRequests(deps, { courseId: 'course-001' });
		const byEmail = await listEnrollmentRequests(deps, { learnerEmail: 'ADA@example.org' });
		const combined = await listEnrollmentRequests(deps, { status: 'pending', courseId: 'course-005', learnerEmail: 'ada@example.org' });
		const none = await listEnrollmentRequests(deps, { learnerEmail: 'nobody@example.org' });

		expect(ids(byStatus)).toEqual(['enroll-002']);
		expect(ids(byCourse)).toEqual(['enroll-001']);
		expect(ids(byEmail)).toEqual(['enroll-001', 'enroll-003']);
		expect(ids(combined)).toEqual(['enroll-003']);
		expect(ids(none)).toEqual([]);
	});

	it('returns 400 for an invalid list filter', async () => {
		const result = await listEnrollmentRequests(deps, { status: 'published', learnerEmail: 'not-an-email', page: '1' });
		const error = expectFailure(result);

		expect(result.status).toBe(400);
		expect(error).toEqual({
			error: {
				code: 'INVALID_REQUEST',
				message: 'The request could not be completed.',
				details: [
					{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' },
					{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' },
					{ field: 'page', message: 'Unexpected query parameter.' },
				],
			},
		});
	});

	it('returns 400 when a list filter is repeated', async () => {
		const result = await listEnrollmentRequests(deps, { status: ['pending', 'approved'] });

		expect(expectFailure(result).error.details).toEqual([{ field: 'status', message: 'status must be provided once.' }]);
	});

	it('approves, rejects, and cancels a pending request, then cancels an approved request', async () => {
		const clock = sequenceClock([createdAt, reviewedAt, '2026-06-27T12:00:00.000Z', '2026-06-27T13:00:00.000Z', '2026-06-27T14:00:00.000Z']);
		deps = dependencies(clock);
		const pendingToApproved = await create(createBody({ learnerEmail: 'approve@example.org' }));
		const approved = await updateEnrollmentRequestStatus(deps, createdId(pendingToApproved), { status: 'approved', changedBy: 'reviewer@example.org' });
		const pendingToRejected = await create(createBody({ learnerEmail: 'reject@example.org' }));
		const rejected = await updateEnrollmentRequestStatus(deps, createdId(pendingToRejected), {
			status: 'rejected',
			changedBy: 'reviewer@example.org',
			reason: '  Learner has not completed the prerequisite course.  ',
		});
		const pendingToCancelled = await create(createBody({ learnerEmail: 'cancel@example.org' }));
		const cancelled = await updateEnrollmentRequestStatus(deps, createdId(pendingToCancelled), { status: 'cancelled', changedBy: 'learner@example.org' });
		const approvedToCancel = await create(createBody({ learnerEmail: 'later@example.org' }));
		await updateEnrollmentRequestStatus(deps, createdId(approvedToCancel), { status: 'approved', changedBy: 'reviewer@example.org' });
		const cancelledApproved = await updateEnrollmentRequestStatus(deps, createdId(approvedToCancel), { status: 'cancelled', changedBy: 'reviewer@example.org', reason: 'Seat was released.' });

		expect(approved.status).toBe(200);
		expect(historyOf(approved)).toEqual([
			{ fromStatus: null, toStatus: 'pending', changedAt: createdAt, changedBy: 'system', reason: null },
			{ fromStatus: 'pending', toStatus: 'approved', changedAt: reviewedAt, changedBy: 'reviewer@example.org', reason: null },
		]);
		expect(historyOf(rejected).at(-1)).toMatchObject({
			fromStatus: 'pending',
			toStatus: 'rejected',
			changedBy: 'reviewer@example.org',
			reason: 'Learner has not completed the prerequisite course.',
		});
		expect(historyOf(cancelled).at(-1)).toMatchObject({ fromStatus: 'pending', toStatus: 'cancelled', changedBy: 'learner@example.org', reason: null });
		expect(historyOf(cancelledApproved).map((entry) => entry.toStatus)).toEqual(['pending', 'approved', 'cancelled']);
		if (approved.ok) {
			expect(approved.body.createdAt).toBe(createdAt);
			expect(approved.body.updatedAt).toBe(reviewedAt);
		}
	});

	it('returns 409 for an invalid status transition and leaves the history unchanged', async () => {
		const created = await create();
		const id = createdId(created);
		await updateEnrollmentRequestStatus(deps, id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Prerequisite is missing from the learner record.' });
		const transition = await updateEnrollmentRequestStatus(deps, id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const current = await getEnrollmentRequest(deps, id);

		expect(transition.status).toBe(409);
		expect(expectFailure(transition)).toEqual({
			error: {
				code: 'INVALID_STATUS_TRANSITION',
				message: 'The status transition is not allowed.',
				details: [{ field: 'status', message: 'Cannot transition from rejected to approved.' }],
			},
		});
		expect(historyOf(current)).toHaveLength(2);
	});

	it('returns 409 when the requested status is valid but not a legal transition', async () => {
		const created = await create();
		const sameStatus = await updateEnrollmentRequestStatus(deps, createdId(created), { status: 'pending', changedBy: 'reviewer@example.org' });

		expect(sameStatus.status).toBe(409);
		expect(expectFailure(sameStatus).error.code).toBe('INVALID_STATUS_TRANSITION');
	});

	it('returns 400 when a rejection has no reason', async () => {
		const created = await create();
		const missing = await updateEnrollmentRequestStatus(deps, createdId(created), { status: 'rejected', changedBy: 'reviewer@example.org' });
		const blank = await updateEnrollmentRequestStatus(deps, createdId(created), { status: 'rejected', changedBy: 'reviewer@example.org', reason: '   ' });
		const current = await getEnrollmentRequest(deps, createdId(created));

		expect(missing.status).toBe(400);
		expect(expectFailure(missing).error.details).toEqual([{ field: 'reason', message: 'reason is required when rejecting a request.' }]);
		expect(blank.status).toBe(400);
		expect(historyOf(current)).toHaveLength(1);
	});

	it('returns 400 for an invalid status value and a missing reviewer', async () => {
		const created = await create();
		const result = await updateEnrollmentRequestStatus(deps, createdId(created), { status: 'closed', reason: 12 });
		const missingRequest = await updateEnrollmentRequestStatus(deps, 'enroll-404', { status: 'approved', changedBy: 'reviewer@example.org' });

		expect(result.status).toBe(400);
		expect(expectFailure(result).error.details).toEqual([
			{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' },
			{ field: 'changedBy', message: 'changedBy is required.' },
			{ field: 'reason', message: 'reason must be a string.' },
		]);
		expect(missingRequest.status).toBe(404);
		expect(expectFailure(missingRequest).error.code).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
	});

	it('refuses an invalid transition on the domain entity', () => {
		const request = EnrollmentRequest.create({
			id: 'enroll-001',
			courseId: 'course-001',
			learnerEmail: 'learner@example.org',
			justification,
			createdAt,
		});

		expect(() => request.withStatus({ toStatus: 'pending', changedAt: reviewedAt, changedBy: 'reviewer@example.org', reason: null })).toThrow(InvalidEnrollmentTransitionError);
	});

	it('keeps course search available beside enrollment requests', async () => {
		const services = await buildApplicationServicesFactory({ environment: 'test' }, createSeededCourseCatalog(), createEnrollmentRequestStore(), { now: () => createdAt }).forRequest();
		const courses = await services.courses.search({ q: 'security', modality: 'online', status: 'active', tag: 'ai' });
		const enrollment = await services.enrollmentRequests.create(createBody());

		expect(courses.ok).toBe(true);
		if (courses.ok) {
			expect(courses.body.totalItems).toBe(1);
			expect(courses.body.items[0]?.id).toBe('course-001');
		}
		expect(enrollment.status).toBe(201);
	});
});

function createdId(result: EnrollmentCommandResult): string {
	if (!result.ok) {
		throw new Error('expected an enrollment request');
	}
	return result.body.id;
}

function historyOf(result: EnrollmentCommandResult): readonly { fromStatus: string | null; toStatus: string; changedAt: string; changedBy: string; reason: string | null }[] {
	if (!result.ok) {
		throw new Error('expected an enrollment request');
	}
	return result.body.statusHistory;
}

function ids(result: EnrollmentListResult): string[] {
	if (!result.ok) {
		throw new Error('expected an enrollment list');
	}
	return result.body.items.map((item) => item.id);
}
