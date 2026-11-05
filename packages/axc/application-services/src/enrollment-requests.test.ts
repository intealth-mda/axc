import { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { buildEnrollmentRequestService } from './enrollment-requests.ts';

const body = (courseId: string, learnerEmail = 'a@example.org') => ({ courseId, learnerEmail, justification: 'I need this course for my work.' });

describe('enrollment request service', () => {
	it('creates, lists, transitions and maps domain errors', async () => {
		const service = buildEnrollmentRequestService(new InMemoryCourseRepository(), new InMemoryEnrollmentRequestRepository());
		const created = await service.create(body('course-001'));
		expect(created.status).toBe('pending');
		await expect(service.create(body('course-001', 'A@example.org'))).rejects.toMatchObject({ code: 'DUPLICATE_ACTIVE_REQUEST' });
		await expect(service.create(body('course-999'))).rejects.toMatchObject({ code: 'COURSE_NOT_FOUND' });
		await expect(service.create(body('course-002'))).rejects.toMatchObject({ code: 'COURSE_NOT_ACTIVE' });
		await expect(service.create(null)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		expect(await service.list({ learnerEmail: 'A@EXAMPLE.ORG', status: 'pending' })).toHaveLength(1);
		await expect(service.list({ status: 'nope' })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
		await service.changeStatus(created.id, { status: 'cancelled', changedBy: 'rev' });
		await expect(service.changeStatus(created.id, { status: 'approved', changedBy: 'rev' })).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
		await expect(service.get('missing')).rejects.toMatchObject({ code: 'ENROLLMENT_REQUEST_NOT_FOUND' });
		expect((await service.get(created.id)).statusHistory).toHaveLength(2);
	});
});
