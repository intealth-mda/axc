import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const make = () => enrollmentRequestService(new InMemoryCourseRepository(), new InMemoryEnrollmentRequestRepository());
const body = { courseId: 'course-001', learnerEmail: 'a@b.co', justification: 'x'.repeat(25) };

describe('enrollment request service', () => {
	it('creates, lists, changes and maps errors', async () => {
		const s = make();
		const r = await s.create(s.toCreateCommand(body));
		expect(r.status).toBe('pending');
		await expect(s.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		expect(await s.list({ learnerEmail: 'A@B.CO', status: 'pending' })).toHaveLength(1);
		const ch = await s.changeStatus(r.id, s.toStatusCommand({ status: 'approved', changedBy: 'rev' }));
		expect(ch.statusHistory).toHaveLength(2);
		await expect(s.changeStatus(r.id, { status: 'pending', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(s.changeStatus(r.id, { status: 'nope', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await expect(s.changeStatus('x', { status: 'approved', changedBy: 'rev' })).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.getById('x')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(s.list({ status: 'x' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
	});
	it.each([
		[{ ...body, courseId: 'missing' }, 'COURSE_NOT_FOUND'],
		[{ ...body, courseId: 'course-005' }, 'COURSE_NOT_ACTIVE'],
		[{ ...body, learnerEmail: 'bad' }, 'INVALID_REQUEST'],
	])('create error %#', async (b, code) => {
		await expect(make().create(b)).rejects.toMatchObject({ code });
	});
	it.each([null, [], { courseId: 1 }])('rejects malformed body %#', (b) => {
		expect(() => make().toCreateCommand(b)).toThrow('could not be completed');
	});
});
