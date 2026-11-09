import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../test-support.ts';

const { EnrollmentValidationError, EnrollmentConflictError } = Domain.Contexts.Training.EnrollmentRequest;
const json = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const valid = { courseId: 'course-001', learnerEmail: 'learner@example.org', justification: 'I need this course for my upcoming project.' };
describe('enrollment HTTP contract', () => {
	it('creates with 201 and parses only the supported input fields', async () => {
		const f = fixture();
		const res = await f.app.request('/api/enrollment-requests', json('POST', { ...valid, status: 'approved' }));
		expect(res.status).toBe(201);
		expect(await res.json()).toEqual(f.enrollment);
		expect(f.services.Training.EnrollmentRequest.create).toHaveBeenCalledWith(valid);
	});
	it('retrieves and lists with all optional filters', async () => {
		const f = fixture();
		expect(await (await f.app.request('/api/enrollment-requests/enroll-001')).json()).toEqual(f.enrollment);
		expect(f.services.Training.EnrollmentRequest.getById).toHaveBeenCalledWith('enroll-001');
		expect(await (await f.app.request('/api/enrollment-requests')).json()).toEqual([f.enrollment]);
		await f.app.request('/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner%40example.org');
		expect(f.services.Training.EnrollmentRequest.queryRequests).toHaveBeenLastCalledWith({ status: 'pending', courseId: 'course-001', learnerEmail: 'learner@example.org' });
	});
	it('patches status with the actor and reason', async () => {
		const f = fixture();
		const input = { status: 'rejected', changedBy: 'reviewer', reason: 'Prerequisite missing' };
		const res = await f.app.request('/api/enrollment-requests/enroll-001/status', json('PATCH', input));
		expect(res.status).toBe(200);
		expect(f.services.Training.EnrollmentRequest.update).toHaveBeenCalledWith('enroll-001', input);
	});
	it.each(['{', 'null', '[]', '"text"'])('returns 400 for malformed body %s', async (body) => {
		const f = fixture();
		for (const [url, method] of [
			['/api/enrollment-requests', 'POST'],
			['/api/enrollment-requests/enroll-001/status', 'PATCH'],
		] as const) {
			const res = await f.app.request(url, { method, body, headers: { 'Content-Type': 'application/json' } });
			expect(res.status).toBe(400);
			expect(await res.json()).toMatchObject({ error: { code: 'INVALID_REQUEST', details: [{ field: 'body' }] } });
		}
		expect(f.services.Training.EnrollmentRequest.create).not.toHaveBeenCalled();
	});
	it('turns wrong field types into validation failures and rejects a non-string reason', async () => {
		const f = fixture();
		vi.mocked(f.services.Training.EnrollmentRequest.create).mockImplementation((input) => {
			Domain.Contexts.Training.EnrollmentRequest.assertCreateEnrollment(input);
			return Promise.resolve(f.enrollment);
		});
		const res = await f.app.request('/api/enrollment-requests', json('POST', { courseId: 3, learnerEmail: [], justification: {} }));
		expect(res.status).toBe(400);
		expect((await res.json()).error.details).toHaveLength(3);
		expect((await f.app.request('/api/enrollment-requests/enroll-001/status', json('PATCH', { status: 'rejected', changedBy: 'reviewer', reason: 3 }))).status).toBe(400);
	});
	it.each(['COURSE_NOT_ACTIVE', 'DUPLICATE_ACTIVE_REQUEST'] as const)('maps create conflict %s to 409', async (code) => {
		const f = fixture();
		vi.mocked(f.services.Training.EnrollmentRequest.create).mockRejectedValue(new EnrollmentConflictError(code));
		const res = await f.app.request('/api/enrollment-requests', json('POST', valid));
		expect(res.status).toBe(409);
		expect(await res.json()).toMatchObject({ error: { code, details: [] } });
	});
	it('maps missing course and request to distinct 404 codes', async () => {
		const f = fixture();
		vi.mocked(f.services.Training.EnrollmentRequest.create).mockRejectedValue(new NotFoundError('Missing course'));
		vi.mocked(f.services.Training.EnrollmentRequest.getById).mockRejectedValue(new NotFoundError('Missing request'));
		vi.mocked(f.services.Training.EnrollmentRequest.update).mockRejectedValue(new NotFoundError('Missing request'));
		for (const [url, options, code] of [
			['/api/enrollment-requests', json('POST', valid), 'COURSE_NOT_FOUND'],
			['/api/enrollment-requests/missing', {}, 'ENROLLMENT_REQUEST_NOT_FOUND'],
			['/api/enrollment-requests/missing/status', json('PATCH', { status: 'approved', changedBy: 'reviewer' }), 'ENROLLMENT_REQUEST_NOT_FOUND'],
		] as const) {
			const res = await f.app.request(url, options);
			expect(res.status).toBe(404);
			expect(await res.json()).toMatchObject({ error: { code } });
		}
	});
	it('maps validation and transition errors to their required status and body', async () => {
		const f = fixture();
		vi.mocked(f.services.Training.EnrollmentRequest.update).mockRejectedValue(new EnrollmentConflictError('INVALID_STATUS_TRANSITION'));
		const conflict = await f.app.request('/api/enrollment-requests/enroll-001/status', json('PATCH', { status: 'pending', changedBy: 'reviewer' }));
		expect(conflict.status).toBe(409);
		expect(await conflict.json()).toMatchObject({ error: { code: 'INVALID_STATUS_TRANSITION' } });
		const details = [{ field: 'reason', message: 'Rejection requires a reason.' }];
		vi.mocked(f.services.Training.EnrollmentRequest.update).mockRejectedValue(new EnrollmentValidationError(details));
		const invalid = await f.app.request('/api/enrollment-requests/enroll-001/status', json('PATCH', { status: 'rejected', changedBy: 'reviewer' }));
		expect(invalid.status).toBe(400);
		expect(await invalid.json()).toEqual({ error: { code: 'INVALID_REQUEST', message: 'The request could not be completed.', details } });
		vi.mocked(f.services.Training.EnrollmentRequest.queryRequests).mockRejectedValue(new EnrollmentValidationError([{ field: 'status', message: 'Invalid status value.' }]));
		expect((await f.app.request('/api/enrollment-requests?status=invalid')).status).toBe(400);
	});
});
