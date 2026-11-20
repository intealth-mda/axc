import { courseSeed, InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { enrollmentRequestService } from './enrollment-requests.ts';

const svc = enrollmentRequestService(new InMemoryEnrollmentRequestRepository(), new InMemoryCourseRepository(courseSeed));
const body = { courseId: 'course-001', learnerEmail: 'u@x.org', justification: 'x'.repeat(30) };

describe('enrollmentRequestService', () => {
	it('maps domain errors to service codes', async () => {
		await expect(svc.create({ ...body, learnerEmail: 'bad' })).rejects.toMatchObject({ code: 'INVALID_REQUEST', details: [{ field: 'learnerEmail' }] });
		await expect(svc.create(null)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		const r = await svc.create(body);
		await expect(svc.create(body)).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await expect(svc.changeStatus(r.id, { status: 'done', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await svc.changeStatus(r.id, { status: 'cancelled', changedBy: 'rev' });
		await expect(svc.changeStatus(r.id, { status: 'approved', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(svc.get('nope')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		await expect(svc.list({ status: 'x' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(await svc.list({ courseId: 'course-001' })).toHaveLength(1);
	});
});
