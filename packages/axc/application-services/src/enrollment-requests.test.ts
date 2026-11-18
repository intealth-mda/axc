import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const svc = () => enrollmentRequestService(new InMemoryCourseRepository(), new InMemoryEnrollmentRequestRepository());
const ok = { courseId: 'course-001', learnerEmail: 'a@b.co', justification: 'x'.repeat(30) };

describe('enrollmentRequestService', () => {
	it('maps errors to service codes', async () => {
		const s = svc();
		const e = await s.create(ok);
		await expect(s.create(ok)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await expect(s.create({ ...ok, courseId: 'nope' })).rejects.toMatchObject({ code: 'COURSE_NOT_FOUND' });
		await expect(s.create({ ...ok, courseId: 'course-005' })).rejects.toMatchObject({ code: 'COURSE_NOT_ACTIVE' });
		await expect(s.create({ ...ok, learnerEmail: 5 })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.create('x')).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.getById('nope')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.changeStatus(e.id, { status: 'bogus', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.changeStatus(e.id, { status: 'rejected', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await s.changeStatus(e.id, { status: 'cancelled', changedBy: 'r' });
		await expect(s.changeStatus(e.id, { status: 'approved', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		expect((await s.list({ status: 'cancelled', learnerEmail: 'A@B.CO' })).items).toHaveLength(1);
		await expect(s.list({ status: 'x' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
});
