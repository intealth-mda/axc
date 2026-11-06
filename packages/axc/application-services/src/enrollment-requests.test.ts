import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildEnrollmentRequestService } from './enrollment-requests.ts';

const justification = 'I need this course for upcoming secure development work.';
const setup = () => buildEnrollmentRequestService(new InMemoryCourseRepository(), new InMemoryEnrollmentRequestRepository());
const codeOf = (promise: Promise<unknown>) =>
	promise.then(
		() => 'OK',
		(e: { code?: string }) => e.code,
	);

describe('enrollment request service', () => {
	it('creates, guards duplicates, retrieves and filters', async () => {
		const service = setup();
		const created = await service.create({ courseId: 'course-001', learnerEmail: 'A@x.org', justification });
		expect(created).toMatchObject({ status: 'pending', learnerEmail: 'a@x.org' });
		expect(await codeOf(service.create({ courseId: 'course-001', learnerEmail: 'a@x.org', justification }))).toBe('DUPLICATE_ACTIVE_REQUEST');
		expect(await service.getById(created.id)).toBe(created);
		expect((await service.list({ status: 'pending', courseId: 'course-001', learnerEmail: 'A@X.org' })).items).toHaveLength(1);
		expect((await service.list({ courseId: 'course-002' })).items).toHaveLength(0);
	});

	it.each([
		[{ courseId: 'nope', learnerEmail: 'a@x.org', justification }, 'COURSE_NOT_FOUND'],
		[{ courseId: 'course-005', learnerEmail: 'a@x.org', justification }, 'COURSE_NOT_ACTIVE'],
		[{ courseId: 'course-001', learnerEmail: 'bad', justification }, 'INVALID_REQUEST'],
		[{ courseId: 'course-001', learnerEmail: 'a@x.org', justification: 'short' }, 'INVALID_REQUEST'],
		[{ courseId: 'course-001', learnerEmail: 'a@x.org' }, 'INVALID_REQUEST'],
		['not an object', 'INVALID_REQUEST'],
	])('create %j -> %s', async (body, code) => {
		expect(await codeOf(setup().create(body))).toBe(code);
	});

	it('changes status, records history and maps errors', async () => {
		const service = setup();
		const { id } = await service.create({ courseId: 'course-001', learnerEmail: 'b@x.org', justification });
		expect(await codeOf(service.changeStatus(id, { status: 'rejected', changedBy: 'rev' }))).toBe('INVALID_REQUEST');
		expect(await codeOf(service.changeStatus(id, { status: 'done', changedBy: 'rev' }))).toBe('INVALID_REQUEST');
		expect(await codeOf(service.changeStatus('missing', { status: 'approved', changedBy: 'rev' }))).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
		const approved = await service.changeStatus(id, { status: 'approved', changedBy: 'rev' });
		expect(approved.statusHistory.map((h) => h.toStatus)).toEqual(['pending', 'approved']);
		expect(await codeOf(service.changeStatus(id, { status: 'rejected', changedBy: 'rev', reason: 'no' }))).toBe('INVALID_STATUS_TRANSITION');
		expect(await codeOf(service.getById('missing'))).toBe('ENROLLMENT_REQUEST_NOT_FOUND');
		expect(await codeOf(service.list({ status: 'done' }))).toBe('INVALID_REQUEST');
	});
});
