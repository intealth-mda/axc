import { createInMemoryEnrollmentRequestStore, createSeededCourseCatalog } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createEnrollmentRequestService, type EnrollmentCommandResult, type EnrollmentRequestDto, type EnrollmentRequestService } from './enrollment-requests.ts';

const JUSTIFICATION = 'I need this course to prepare for upcoming secure development work.';
const CREATED_AT = '2026-06-27T10:00:00.000Z';
const REVIEWED_AT = '2026-06-27T11:00:00.000Z';
const CANCELLED_AT = '2026-06-27T12:00:00.000Z';

describe('enrollment requests', () => {
	it('creates a pending request with an opening history entry', async () => {
		const { service } = setup();

		const created = await service.create(requestBody('course-001', 'learner@example.org'));

		expect(created).toEqual({
			ok: true,
			status: 201,
			body: {
				id: 'enroll-001',
				courseId: 'course-001',
				learnerEmail: 'learner@example.org',
				justification: JUSTIFICATION,
				status: 'pending',
				createdAt: CREATED_AT,
				updatedAt: CREATED_AT,
				statusHistory: [
					{
						fromStatus: null,
						toStatus: 'pending',
						changedAt: CREATED_AT,
						changedBy: 'system',
						reason: null,
					},
				],
			},
		});
	});

	it('rejects a missing course, a draft course, and a retired course', async () => {
		const { service } = setup();

		const missing = await service.create(requestBody('course-999', 'missing@example.org'));
		const draft = await service.create(requestBody('course-003', 'draft@example.org'));
		const retired = await service.create(requestBody('course-004', 'retired@example.org'));

		expect(missing).toMatchObject({ ok: false, status: 404, body: { error: { code: 'COURSE_NOT_FOUND' } } });
		expect(draft).toMatchObject({
			ok: false,
			status: 409,
			body: { error: { code: 'COURSE_NOT_ACTIVE', details: [{ field: 'courseId', message: 'The course status is draft.' }] } },
		});
		expect(retired).toMatchObject({
			ok: false,
			status: 409,
			body: { error: { code: 'COURSE_NOT_ACTIVE', details: [{ field: 'courseId', message: 'The course status is retired.' }] } },
		});
	});

	it('rejects an invalid email and a short or long justification', async () => {
		const { service } = setup();

		const invalidEmail = await service.create({ courseId: 'course-001', learnerEmail: 'learner-at-example.org', justification: JUSTIFICATION });
		const shortJustification = await service.create({ courseId: 'course-001', learnerEmail: 'short@example.org', justification: 'too short' });
		const longJustification = await service.create({ courseId: 'course-001', learnerEmail: 'long@example.org', justification: 'a'.repeat(501) });
		const exactBounds = await service.create({ courseId: 'course-001', learnerEmail: 'bounds@example.org', justification: 'b'.repeat(20) });
		const upperBound = await service.create({ courseId: 'course-002', learnerEmail: 'bounds@example.org', justification: 'c'.repeat(500) });

		expect(invalidEmail).toMatchObject({
			ok: false,
			status: 400,
			body: { error: { code: 'INVALID_REQUEST', message: 'The request could not be completed.', details: [{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' }] } },
		});
		expect(shortJustification).toMatchObject({
			ok: false,
			status: 400,
			body: { error: { details: [{ field: 'justification', message: 'justification must be between 20 and 500 characters.' }] } },
		});
		expect(longJustification).toMatchObject({ ok: false, status: 400, body: { error: { code: 'INVALID_REQUEST' } } });
		expect(exactBounds.status).toBe(201);
		expect(upperBound.status).toBe(201);
	});

	it('rejects a non-object body and unsupported fields', async () => {
		const { service } = setup();

		const arrayBody = await service.create([]);
		const extraField = await service.create({ ...requestBody('course-001', 'extra@example.org'), status: 'approved' });

		expect(arrayBody).toMatchObject({ ok: false, status: 400, body: { error: { details: [{ field: 'body', message: 'Request body must be a JSON object.' }] } } });
		expect(extraField).toMatchObject({ ok: false, status: 400, body: { error: { details: [{ field: 'status', message: 'status is not a supported field.' }] } } });
	});

	it('prevents a second pending or approved request for the same learner and course', async () => {
		const { service, at } = setup();
		await create(service, 'course-001', 'Learner@example.org');
		at(REVIEWED_AT);

		const duplicatePending = await service.create(requestBody('course-001', 'learner@example.org'));
		const otherCourse = await service.create(requestBody('course-002', 'learner@example.org'));
		const approved = await create(service, 'course-006', 'approved@example.org');
		await service.updateStatus(approved.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		const duplicateApproved = await service.create(requestBody('course-006', 'approved@example.org'));

		expect(duplicatePending).toMatchObject({ ok: false, status: 409, body: { error: { code: 'DUPLICATE_ACTIVE_REQUEST' } } });
		expect(otherCourse.status).toBe(201);
		expect(duplicateApproved).toMatchObject({ ok: false, status: 409, body: { error: { code: 'DUPLICATE_ACTIVE_REQUEST' } } });
	});

	it('allows a new request after the earlier one is rejected or cancelled', async () => {
		const { service, at } = setup();
		const rejected = await create(service, 'course-001', 'again@example.org');
		at(REVIEWED_AT);
		await service.updateStatus(rejected.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Prerequisite is missing.' });
		const afterRejection = await service.create(requestBody('course-001', 'again@example.org'));
		const cancelled = await create(service, 'course-002', 'again@example.org');
		at(CANCELLED_AT);
		await service.updateStatus(cancelled.id, { status: 'cancelled', changedBy: 'learner@example.org' });
		const afterCancel = await service.create(requestBody('course-002', 'again@example.org'));

		expect(afterRejection.status).toBe(201);
		expect(afterCancel.status).toBe(201);
	});

	it('returns a request by id and 404 when it is missing', async () => {
		const { service } = setup();
		const created = await create(service, 'course-001', 'fetch@example.org');

		const found = await service.getById(created.id);
		const missing = await service.getById('enroll-404');

		expect(found).toMatchObject({ ok: true, status: 200, body: { id: created.id, statusHistory: [{ fromStatus: null, toStatus: 'pending' }] } });
		expect(missing).toMatchObject({ ok: false, status: 404, body: { error: { code: 'ENROLLMENT_REQUEST_NOT_FOUND' } } });
	});

	it('filters the list by status, courseId, and learnerEmail together', async () => {
		const { service, at } = setup();
		await create(service, 'course-001', 'filter@example.org');
		at(REVIEWED_AT);
		const second = await create(service, 'course-002', 'filter@example.org');
		await service.updateStatus(second.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		await create(service, 'course-001', 'other@example.org');

		const filtered = await service.list({ status: ['pending'], courseId: ['course-001'], learnerEmail: ['Filter@example.org'] });
		const approved = await service.list({ status: ['approved'] });
		const invalid = await service.list({ status: ['archived'], page: ['1'] });

		expect(filtered).toMatchObject({ ok: true, status: 200, body: { items: [{ id: 'enroll-001', status: 'pending', courseId: 'course-001' }] } });
		expect(approved.body).toMatchObject({ items: [{ id: second.id, status: 'approved' }] });
		expect(invalid).toEqual({
			ok: false,
			status: 400,
			body: {
				error: {
					code: 'INVALID_REQUEST',
					message: 'The request could not be completed.',
					details: [
						{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' },
						{ field: 'page', message: 'page is not a supported query parameter.' },
					],
				},
			},
		});
	});

	it('applies the allowed status transitions and appends history', async () => {
		const { service, at } = setup();
		const request = await create(service, 'course-001', 'transition@example.org');
		at(REVIEWED_AT);
		const approved = await service.updateStatus(request.id, { status: 'approved', changedBy: 'reviewer@example.org' });
		at(CANCELLED_AT);
		const cancelled = await service.updateStatus(request.id, { status: 'cancelled', changedBy: 'reviewer@example.org', reason: 'Cohort was rescheduled.' });

		expect(approved).toMatchObject({ ok: true, status: 200, body: { status: 'approved', updatedAt: REVIEWED_AT } });
		expect(historyOf(cancelled)).toEqual([
			{ fromStatus: null, toStatus: 'pending', changedAt: CREATED_AT, changedBy: 'system', reason: null },
			{ fromStatus: 'pending', toStatus: 'approved', changedAt: REVIEWED_AT, changedBy: 'reviewer@example.org', reason: null },
			{ fromStatus: 'approved', toStatus: 'cancelled', changedAt: CANCELLED_AT, changedBy: 'reviewer@example.org', reason: 'Cohort was rescheduled.' },
		]);
	});

	it('rejects, cancels, and records the rejection reason', async () => {
		const { service, at } = setup();
		const toReject = await create(service, 'course-001', 'reject@example.org');
		const toCancel = await create(service, 'course-002', 'cancel@example.org');
		at(REVIEWED_AT);

		const rejected = await service.updateStatus(toReject.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: '  Learner has not completed the prerequisite course.  ' });
		const cancelled = await service.updateStatus(toCancel.id, { status: 'cancelled', changedBy: 'learner@example.org' });

		expect(historyOf(rejected).at(-1)).toEqual({
			fromStatus: 'pending',
			toStatus: 'rejected',
			changedAt: REVIEWED_AT,
			changedBy: 'reviewer@example.org',
			reason: 'Learner has not completed the prerequisite course.',
		});
		expect(historyOf(cancelled).at(-1)).toMatchObject({ fromStatus: 'pending', toStatus: 'cancelled', reason: null });
	});

	it('returns 409 for an invalid transition and leaves the request unchanged', async () => {
		const { service, at } = setup();
		const request = await create(service, 'course-001', 'conflict@example.org');
		at(REVIEWED_AT);
		await service.updateStatus(request.id, { status: 'approved', changedBy: 'reviewer@example.org' });

		const rejected = await service.updateStatus(request.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Too late.' });
		const stored = await service.getById(request.id);

		expect(rejected).toMatchObject({
			ok: false,
			status: 409,
			body: { error: { code: 'INVALID_STATUS_TRANSITION', details: [{ field: 'status', message: 'approved cannot change to rejected.' }] } },
		});
		expect(stored).toMatchObject({ ok: true, body: { status: 'approved', statusHistory: [{ toStatus: 'pending' }, { toStatus: 'approved' }] } });
	});

	it('returns 400 when a rejection has no reason or the status is invalid', async () => {
		const { service } = setup();
		const request = await create(service, 'course-001', 'reason@example.org');

		const missingReason = await service.updateStatus(request.id, { status: 'rejected', changedBy: 'reviewer@example.org' });
		const blankReason = await service.updateStatus(request.id, { status: 'rejected', changedBy: 'reviewer@example.org', reason: '   ' });
		const badStatus = await service.updateStatus(request.id, { status: 'done', changedBy: 'reviewer@example.org' });
		const stored = await service.getById(request.id);

		expect(missingReason).toMatchObject({ ok: false, status: 400, body: { error: { code: 'INVALID_REQUEST', details: [{ field: 'reason', message: 'reason is required when status is rejected.' }] } } });
		expect(blankReason).toMatchObject({ ok: false, status: 400, body: { error: { code: 'INVALID_REQUEST' } } });
		expect(badStatus).toMatchObject({
			ok: false,
			status: 400,
			body: { error: { details: [{ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' }] } },
		});
		expect(stored).toMatchObject({ ok: true, body: { status: 'pending', statusHistory: [{ toStatus: 'pending' }] } });
	});
});

function setup(): { service: EnrollmentRequestService; at: (instant: string) => void } {
	let instant = CREATED_AT;
	const service = createEnrollmentRequestService({
		catalog: createSeededCourseCatalog(),
		store: createInMemoryEnrollmentRequestStore(),
		now: () => instant,
	});
	return {
		service,
		at(value: string) {
			instant = value;
		},
	};
}

function requestBody(courseId: string, learnerEmail: string): { courseId: string; learnerEmail: string; justification: string } {
	return { courseId, learnerEmail, justification: JUSTIFICATION };
}

async function create(service: EnrollmentRequestService, courseId: string, learnerEmail: string): Promise<EnrollmentRequestDto> {
	const result = await service.create(requestBody(courseId, learnerEmail));
	return commandBody(result);
}

function historyOf(result: EnrollmentCommandResult): EnrollmentRequestDto['statusHistory'] {
	return commandBody(result).statusHistory;
}

function commandBody(result: EnrollmentCommandResult): EnrollmentRequestDto {
	if (!result.ok) {
		throw new Error(`expected a successful enrollment result, received ${result.status}`);
	}
	return result.body;
}
