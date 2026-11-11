import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createEnrollmentRequestService } from './enrollment-requests.ts';

const svc = createEnrollmentRequestService(new InMemoryCourseRepository(), new InMemoryEnrollmentRequestRepository());
const body = { courseId: 'course-001', learnerEmail: 'unit@example.org', justification: 'x'.repeat(30) };

describe('enrollment request service', () => {
	it('creates, blocks duplicates, transitions, lists', async () => {
		const r = await svc.create(body);
		await expect(svc.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await expect(svc.changeStatus(r.id, { status: 'rejected', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_REQUEST', details: [{ field: 'reason' }] });
		const changed = await svc.changeStatus(r.id, { status: 'approved', changedBy: 'rev' });
		expect(changed.statusHistory.map((h) => h.toStatus)).toEqual(['pending', 'approved']);
		await expect(svc.changeStatus(r.id, { status: 'pending', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		expect((await svc.list({ status: 'approved', learnerEmail: 'UNIT@example.org' })).items).toHaveLength(1);
		expect((await svc.get(r.id)).status).toBe('approved');
	});

	it.each([
		[{ ...body, courseId: 'nope' }, 'COURSE_NOT_FOUND'],
		[{ ...body, courseId: 'course-004' }, 'COURSE_NOT_ACTIVE'],
		[{ ...body, learnerEmail: 'bad' }, 'INVALID_REQUEST'],
		[{ courseId: 'course-001' }, 'INVALID_REQUEST'],
		['text', 'INVALID_REQUEST'],
	])('create %j -> %s', async (input, code) => {
		await expect(svc.create(input)).rejects.toMatchObject({ code });
	});

	it('maps missing ids and bad filters', async () => {
		await expect(svc.get('x')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(svc.changeStatus('x', { status: 'approved', changedBy: 'r' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(svc.changeStatus('x', { status: 'done', changedBy: 'r' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(svc.changeStatus('x', { status: 'rejected', changedBy: 'r', reason: 5 })).rejects.toMatchObject({ details: [{ field: 'reason' }] });
		await expect(svc.list({ status: 'done' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
});
