import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestServices, parseChangeStatus, parseCreate } from './enrollment-requests.ts';

const J = 'I need this course for upcoming secure development work.';
const svc = () => enrollmentRequestServices(new InMemoryEnrollmentRequestRepository(), new InMemoryCourseRepository());

describe('enrollment request services', () => {
	it('creates, blocks duplicates, transitions and audits', async () => {
		const s = svc();
		const e = await s.create({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: J });
		expect(e.status).toBe('pending');
		await expect(s.create({ courseId: 'course-001', learnerEmail: 'A@b.org', justification: J })).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await s.changeStatus(e.id, { status: 'cancelled', changedBy: 'r', reason: null });
		const again = await s.create({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: J });
		expect((await s.list({ status: 'cancelled' })).items.map((x) => x.id)).toEqual([e.id]);
		expect((await s.get(e.id)).statusHistory).toHaveLength(2);
		expect(again.id).not.toBe(e.id);
	});

	it.each([
		[{ courseId: 'nope', learnerEmail: 'a@b.org', justification: J }, 'COURSE_NOT_FOUND'],
		[{ courseId: 'course-002', learnerEmail: 'a@b.org', justification: J }, 'COURSE_NOT_ACTIVE'],
		[{ courseId: 'course-001', learnerEmail: 'bad', justification: J }, 'INVALID_REQUEST'],
		[{ courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'short' }, 'INVALID_REQUEST'],
	])('create %j -> %s', async (cmd, code) => {
		await expect(svc().create(cmd)).rejects.toMatchObject({ code });
	});

	it('maps status errors', async () => {
		const s = svc();
		const { id } = await s.create({ courseId: 'course-001', learnerEmail: 'a@b.org', justification: J });
		await expect(s.changeStatus('nope', { status: 'approved', changedBy: 'r', reason: null })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.changeStatus(id, { status: 'done', changedBy: 'r', reason: null })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.changeStatus(id, { status: 'rejected', changedBy: 'r', reason: null })).rejects.toMatchObject({ code: 'INVALID_REQUEST', details: [{ field: 'reason' }] });
		await expect(s.changeStatus(id, { status: 'pending', changedBy: 'r', reason: null })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(s.list({ status: 'x' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.get('nope')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
	});

	it('parses bodies', () => {
		expect(() => parseCreate(null)).toThrow(expect.objectContaining({ details: [{ field: 'courseId', message: 'courseId must be a non-empty string.' }] }));
		expect(() => parseChangeStatus({ status: 'approved', changedBy: 'r', reason: 5 })).toThrow(expect.objectContaining({ details: [{ field: 'reason', message: 'reason must be a string.' }] }));
		expect(parseChangeStatus({ status: 'approved', changedBy: 'r' })).toEqual({ status: 'approved', changedBy: 'r', reason: null });
	});
});
