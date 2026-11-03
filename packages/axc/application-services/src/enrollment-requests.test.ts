import { describe, expect, it } from 'vitest';
import { buildApplicationServicesFactory, type ServiceError } from './index.ts';

const services = () => buildApplicationServicesFactory({ environment: 'test' }).forRequest();
const body = { courseId: 'course-001', learnerEmail: 'a@b.org', justification: 'x'.repeat(20) };

describe('application services', () => {
	it('maps rule violations to service error codes', async () => {
		const { enrollmentRequests: s } = await services();
		await s.create(body);
		const codeOf = (p: Promise<unknown>) =>
			p.then(
				() => 'ok',
				(e: ServiceError) => e.code,
			);
		expect(
			await Promise.all([
				codeOf(s.create(body)),
				codeOf(s.create({ ...body, courseId: 'course-404' })),
				codeOf(s.create({ ...body, courseId: 'course-004' })),
				codeOf(s.create({ ...body, learnerEmail: 'bad' })),
				codeOf(s.create(null)),
				codeOf(s.getById('enroll-999')),
				codeOf(s.changeStatus('enroll-001', { status: 'pending', changedBy: 'r' })),
			]),
		).toEqual(['DUPLICATE_ACTIVE_REQUEST', 'COURSE_NOT_FOUND', 'COURSE_NOT_ACTIVE', 'INVALID_REQUEST', 'INVALID_REQUEST', 'ENROLLMENT_REQUEST_NOT_FOUND', 'INVALID_STATUS_TRANSITION']);
	});
});
