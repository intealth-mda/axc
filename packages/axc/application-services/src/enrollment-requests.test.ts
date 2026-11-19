import { courseSeed, InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const svc = enrollmentRequestService(new InMemoryCourseRepository(courseSeed), new InMemoryEnrollmentRequestRepository());
const body = { courseId: 'course-001', learnerEmail: 'u@x.org', justification: 'x'.repeat(30) };

describe('enrollmentRequestService', () => {
	it('creates, lists and transitions', async () => {
		const r = await svc.create(body);
		await expect(svc.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		expect((await svc.list({ learnerEmail: 'U@x.org' })).map((x) => x.id)).toEqual([r.id]);
		const c = await svc.changeStatus(r.id, { status: 'cancelled', changedBy: 'rev' });
		expect(c.statusHistory).toHaveLength(2);
		await expect(svc.changeStatus(r.id, { status: 'approved', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
	});
	it.each([
		[{ ...body, courseId: 'nope' }, 'COURSE_NOT_FOUND'],
		[{ ...body, courseId: 'course-005' }, 'COURSE_NOT_ACTIVE'],
		[{ ...body, learnerEmail: 'bad' }, 'INVALID_REQUEST'],
		[null, 'INVALID_REQUEST'],
	])('create error %#', async (b, code) => {
		await expect(svc.create(b)).rejects.toMatchObject({ code });
	});
	it('maps get/patch errors', async () => {
		await expect(svc.get('nope')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(svc.changeStatus('nope', { status: 'approved', changedBy: 'r' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(svc.changeStatus('nope', { status: 'done', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(svc.list({ status: 'done' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
});
