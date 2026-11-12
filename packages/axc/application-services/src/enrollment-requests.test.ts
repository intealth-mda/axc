import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const svc = () => enrollmentRequestService(new InMemoryCourseRepository(), new InMemoryEnrollmentRequestRepository());
const body = { courseId: 'course-001', learnerEmail: 'a@b.co', justification: 'x'.repeat(25) };

describe('enrollmentRequestService', () => {
	it('creates, blocks duplicate, changes status with history', async () => {
		const s = svc();
		const r = await s.create(body);
		await expect(s.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		const u = await s.changeStatus(r.id, { status: 'approved', changedBy: 'rev' });
		expect(u.statusHistory.map((h) => h.toStatus)).toEqual(['pending', 'approved']);
		expect((await s.list({ status: 'approved' })).items.map((x) => x.id)).toEqual([r.id]);
	});
	it.each([
		[{ ...body, courseId: 'nope' }, 'COURSE_NOT_FOUND'],
		[{ ...body, courseId: 'course-005' }, 'COURSE_NOT_ACTIVE'],
		[{ ...body, learnerEmail: 'bad' }, 'INVALID_REQUEST'],
		[null, 'INVALID_REQUEST'],
	])('create %j -> %s', async (b, code) => {
		await expect(svc().create(b)).rejects.toMatchObject({ code });
	});
	it('maps status errors', async () => {
		const s = svc();
		const r = await s.create(body);
		await expect(s.changeStatus(r.id, { status: 'pending', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(s.changeStatus(r.id, { status: 'bogus', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.changeStatus('none', { status: 'approved', changedBy: 'rev' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.getById('none')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.list({ status: 'bogus' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
});
