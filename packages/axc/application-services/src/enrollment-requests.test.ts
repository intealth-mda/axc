import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const svc = () => enrollmentRequestService(new InMemoryEnrollmentRequestRepository(), new InMemoryCourseRepository());
const body = { courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(25) };

describe('enrollment request service', () => {
	it('creates, lists and changes status in a transaction', async () => {
		const s = svc();
		const r = await s.create(body);
		expect(r.status).toBe('pending');
		await expect(s.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		expect(await s.list({ courseId: 'course-001' })).toHaveLength(1);
		const changed = await s.changeStatus(r.id, { status: 'approved', changedBy: 'rev' });
		expect(changed.statusHistory).toHaveLength(2);
	});
	it.each([
		[{ ...body, courseId: 'nope' }, 'COURSE_NOT_FOUND'],
		[{ ...body, courseId: 'course-004' }, 'COURSE_NOT_ACTIVE'],
		[{ ...body, learnerEmail: 'bad' }, 'INVALID_REQUEST'],
		[{ ...body, justification: 1 }, 'INVALID_REQUEST'],
		[null, 'INVALID_REQUEST'],
	])('maps create errors %#', async (b, code) => {
		await expect(svc().create(b)).rejects.toMatchObject({ code });
	});
	it('maps status errors', async () => {
		const s = svc();
		const { id } = await s.create(body);
		await expect(s.get('nope')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.changeStatus('nope', { status: 'approved', changedBy: 'r' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.changeStatus(id, { status: 'done', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.changeStatus(id, { status: 'rejected', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST', details: [{ field: 'reason' }] });
		await expect(s.changeStatus(id, { status: 'pending', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(s.list({ status: 'x' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
});
