import { courseSeed, InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const svc = enrollmentRequestService(new InMemoryCourseRepository(courseSeed), new InMemoryEnrollmentRequestRepository());
const justification = 'I need this course for upcoming secure work.';
const code = (p: Promise<unknown>) =>
	p.then(
		() => 'ok',
		(e: { code?: string }) => e.code,
	);

describe('enrollmentRequestService', () => {
	it('creates, guards duplicates, transitions and lists', async () => {
		const created = await svc.create({ courseId: 'course-001', learnerEmail: 'a@b.org', justification });
		expect(created.status).toBe('pending');
		expect(await code(svc.create({ courseId: 'course-001', learnerEmail: 'a@b.org', justification }))).toBe('DUPLICATE_ACTIVE_REQUEST');
		const approved = await svc.changeStatus(created.id, { status: 'approved', changedBy: 'rev' });
		expect(approved.statusHistory).toHaveLength(2);
		expect((await svc.list({ status: 'approved' })).items.map((r) => r.id)).toEqual([created.id]);
		expect((await svc.getById(created.id)).status).toBe('approved');
	});
	it.each([
		[() => svc.create({ courseId: 'nope', learnerEmail: 'a@b.org', justification }), 'COURSE_NOT_FOUND'],
		[() => svc.create({ courseId: 'course-003', learnerEmail: 'a@b.org', justification }), 'COURSE_NOT_ACTIVE'],
		[() => svc.create({ courseId: 'course-002', learnerEmail: 'bad', justification }), 'INVALID_REQUEST'],
		[() => svc.create('nope'), 'INVALID_REQUEST'],
		[() => svc.getById('nope'), 'ENROLLMENT_REQUEST_NOT_FOUND'],
		[() => svc.list({ status: 'x' }), 'INVALID_REQUEST'],
		[() => svc.changeStatus('nope', { status: 'approved', changedBy: 'rev' }), 'ENROLLMENT_REQUEST_NOT_FOUND'],
		[() => svc.changeStatus('nope', { status: 'x', changedBy: 'rev' }), 'INVALID_REQUEST'],
	])('maps error %#', async (run, expected) => {
		expect(await code(run())).toBe(expected);
	});
	it('maps invalid transition and missing reason', async () => {
		const r = await svc.create({ courseId: 'course-005', learnerEmail: 'z@b.org', justification });
		expect(await code(svc.changeStatus(r.id, { status: 'rejected', changedBy: 'rev' }))).toBe('INVALID_REQUEST');
		expect(await code(svc.changeStatus(r.id, { status: 'pending', changedBy: 'rev' }))).toBe('INVALID_STATUS_TRANSITION');
	});
});
