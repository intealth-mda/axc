import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory } from '../../../index.ts';
import { EnrollmentRequestError } from './create.ts';

const justification = 'I need this course to prepare for upcoming secure development work.';

async function service() {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.enrollmentRequest;
}

function email(label: string): string {
	return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.org`;
}

describe('enrollment requests', () => {
	it('creates a pending request and records the audit trail', async () => {
		const enrollment = await service();
		const learnerEmail = email('create');
		const created = await enrollment.create({ courseId: 'course-001', learnerEmail, justification });

		expect(created.status).toBe('pending');
		expect(created.courseId).toBe('course-001');
		expect(created.statusHistory).toEqual([
			{
				fromStatus: null,
				toStatus: 'pending',
				changedAt: created.createdAt,
				changedBy: 'system',
				reason: null,
			},
		]);

		const found = await enrollment.getById(created.id);
		expect(found).toEqual(created);
	});

	it('rejects a missing course, a draft course, and a retired course', async () => {
		const enrollment = await service();
		const learnerEmail = email('course');

		await expect(enrollment.create({ courseId: 'course-missing', learnerEmail, justification })).rejects.toMatchObject({ code: 'COURSE_NOT_FOUND', statusCode: 404 });
		await expect(enrollment.create({ courseId: 'course-003', learnerEmail, justification })).rejects.toMatchObject({ code: 'COURSE_NOT_ACTIVE', statusCode: 409 });
		await expect(enrollment.create({ courseId: 'course-005', learnerEmail, justification })).rejects.toMatchObject({ code: 'COURSE_NOT_ACTIVE', statusCode: 409 });
	});

	it('rejects an invalid email and a short or oversized justification', async () => {
		const enrollment = await service();
		const learnerEmail = email('valid');

		await expect(enrollment.create({ courseId: 'course-001', learnerEmail: 'not-an-email', justification })).rejects.toMatchObject({
			code: 'INVALID_REQUEST',
			statusCode: 400,
			details: [{ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' }],
		});

		const both = enrollment.create({ courseId: 'course-001', learnerEmail: 'not-an-email', justification: 'too short' }).catch((error: unknown) => error);
		const invalid = await both;
		expect(invalid).toBeInstanceOf(EnrollmentRequestError);
		if (!(invalid instanceof EnrollmentRequestError)) {
			throw new Error('expected EnrollmentRequestError');
		}
		expect(invalid.details.map((detail) => detail.field).sort()).toEqual(['justification', 'learnerEmail']);

		await expect(enrollment.create({ courseId: 'course-001', learnerEmail, justification: 'a'.repeat(19) })).rejects.toMatchObject({ statusCode: 400 });
		await expect(enrollment.create({ courseId: 'course-001', learnerEmail, justification: 'a'.repeat(501) })).rejects.toMatchObject({ statusCode: 400 });

		const minimum = await enrollment.create({ courseId: 'course-001', learnerEmail: email('min'), justification: 'a'.repeat(20) });
		const maximum = await enrollment.create({ courseId: 'course-002', learnerEmail: email('max'), justification: 'a'.repeat(500) });
		expect(minimum.status).toBe('pending');
		expect(maximum.justification).toHaveLength(500);
	});

	it('blocks a second pending or approved request and allows one after rejection', async () => {
		const enrollment = await service();
		const pendingEmail = email('pending');
		await enrollment.create({ courseId: 'course-001', learnerEmail: pendingEmail, justification });
		await expect(enrollment.create({ courseId: 'course-001', learnerEmail: pendingEmail, justification })).rejects.toMatchObject({
			code: 'DUPLICATE_ACTIVE_REQUEST',
			statusCode: 409,
		});

		const approvedEmail = email('approved');
		const approved = await enrollment.create({ courseId: 'course-002', learnerEmail: approvedEmail, justification });
		await enrollment.updateStatus({ id: approved.id, status: 'approved', changedBy: 'reviewer@example.org' });
		await expect(enrollment.create({ courseId: 'course-002', learnerEmail: approvedEmail, justification })).rejects.toMatchObject({
			code: 'DUPLICATE_ACTIVE_REQUEST',
			statusCode: 409,
		});

		const rejectedEmail = email('rejected');
		const rejected = await enrollment.create({ courseId: 'course-006', learnerEmail: rejectedEmail, justification });
		await enrollment.updateStatus({ id: rejected.id, status: 'rejected', changedBy: 'reviewer@example.org', reason: 'Prerequisite is missing.' });
		const again = await enrollment.create({ courseId: 'course-006', learnerEmail: rejectedEmail, justification });
		expect(again.status).toBe('pending');
	});

	it('filters by status, courseId, and learnerEmail', async () => {
		const enrollment = await service();
		const learnerEmail = email('filter');
		const created = await enrollment.create({ courseId: 'course-007', learnerEmail, justification });
		await enrollment.updateStatus({ id: created.id, status: 'cancelled', changedBy: 'reviewer@example.org' });

		const byStatus = await enrollment.list({ status: 'cancelled', courseId: 'course-007', learnerEmail });
		expect(byStatus.map((item) => item.id)).toContain(created.id);

		const missed = await enrollment.list({ status: 'approved', courseId: 'course-007', learnerEmail });
		expect(missed.map((item) => item.id)).not.toContain(created.id);
	});

	it('applies the allowed transitions and appends status history', async () => {
		const enrollment = await service();
		const approved = await enrollment.create({ courseId: 'course-001', learnerEmail: email('to-approved'), justification });
		const approvedResult = await enrollment.updateStatus({ id: approved.id, status: 'approved', changedBy: 'reviewer@example.org' });
		expect(approvedResult.status).toBe('approved');
		expect(approvedResult.statusHistory.map((entry) => entry.toStatus)).toEqual(['pending', 'approved']);

		const rejected = await enrollment.create({ courseId: 'course-001', learnerEmail: email('to-rejected'), justification });
		const rejectedResult = await enrollment.updateStatus({
			id: rejected.id,
			status: 'rejected',
			changedBy: 'reviewer@example.org',
			reason: 'Learner has not completed the prerequisite course.',
		});
		expect(rejectedResult.statusHistory).toHaveLength(2);
		expect(rejectedResult.statusHistory[1]?.toStatus).toBe('rejected');

		const cancelled = await enrollment.create({ courseId: 'course-001', learnerEmail: email('to-cancelled'), justification });
		const cancelledResult = await enrollment.updateStatus({ id: cancelled.id, status: 'cancelled', changedBy: 'learner@example.org' });
		expect(cancelledResult.status).toBe('cancelled');

		const approvedThenCancelled = await enrollment.create({ courseId: 'course-002', learnerEmail: email('approved-cancel'), justification });
		await enrollment.updateStatus({ id: approvedThenCancelled.id, status: 'approved', changedBy: 'reviewer@example.org' });
		const finalStatus = await enrollment.updateStatus({ id: approvedThenCancelled.id, status: 'cancelled', changedBy: 'reviewer@example.org' });
		expect(finalStatus.status).toBe('cancelled');
		expect(finalStatus.statusHistory).toHaveLength(3);
	});

	it('returns 409 for an invalid transition and 400 when a rejection has no reason', async () => {
		const enrollment = await service();
		const request = await enrollment.create({ courseId: 'course-002', learnerEmail: email('invalid-transition'), justification });
		await enrollment.updateStatus({ id: request.id, status: 'approved', changedBy: 'reviewer@example.org' });

		await expect(enrollment.updateStatus({ id: request.id, status: 'rejected', changedBy: 'reviewer@example.org', reason: 'No longer allowed.' })).rejects.toMatchObject({
			code: 'INVALID_STATUS_TRANSITION',
			statusCode: 409,
		});
		await expect(enrollment.updateStatus({ id: 'enroll-missing', status: 'approved', changedBy: 'reviewer@example.org' })).rejects.toMatchObject({
			code: 'ENROLLMENT_REQUEST_NOT_FOUND',
			statusCode: 404,
		});
		await expect(enrollment.getById('enroll-missing')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND', statusCode: 404 });

		const pending = await enrollment.create({ courseId: 'course-007', learnerEmail: email('needs-reason'), justification });
		await expect(enrollment.updateStatus({ id: pending.id, status: 'rejected', changedBy: 'reviewer@example.org' })).rejects.toMatchObject({
			code: 'INVALID_REQUEST',
			statusCode: 400,
			details: [{ field: 'reason', message: 'reason is required when rejecting a request.' }],
		});
		await expect(enrollment.updateStatus({ id: pending.id, status: 'closed', changedBy: 'reviewer@example.org' })).rejects.toMatchObject({
			code: 'INVALID_REQUEST',
			statusCode: 400,
		});
	});
});
