import { courseSeed, InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildEnrollmentRequestService } from './enrollment-requests.ts';

const svc = buildEnrollmentRequestService(new InMemoryCourseRepository(courseSeed), new InMemoryEnrollmentRequestRepository());
const body = { courseId: 'course-001', learnerEmail: 'u@example.org', justification: 'x'.repeat(25) };

describe('enrollment request service', () => {
	it('maps domain and lookup failures to service codes', async () => {
		await expect(svc.create({ ...body, learnerEmail: 7 })).rejects.toMatchObject({ code: 'INVALID_REQUEST', details: [{ field: 'learnerEmail' }] });
		await expect(svc.create({ ...body, courseId: 'course-003' })).rejects.toMatchObject({ code: 'COURSE_NOT_ACTIVE' });
		const created = await svc.create(body);
		await expect(svc.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await expect(svc.changeStatus(created.id, { status: 'done', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await svc.changeStatus(created.id, { status: 'cancelled', changedBy: 'r' });
		await expect(svc.changeStatus(created.id, { status: 'approved', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(svc.get('nope')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		expect((await svc.list({ status: 'cancelled' })).map((r) => r.id)).toEqual([created.id]);
	});
});
