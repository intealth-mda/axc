import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import type { Context, Hono } from 'hono';

const { EnrollmentValidationError, EnrollmentConflictError } = Domain.Contexts.Training.EnrollmentRequest;
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
interface EnrollmentBody {
	courseId?: unknown;
	learnerEmail?: unknown;
	justification?: unknown;
	status?: unknown;
	changedBy?: unknown;
	reason?: unknown;
}
async function body(c: Context): Promise<EnrollmentBody> {
	try {
		const value: unknown = await c.req.json();
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value as EnrollmentBody;
	} catch {
		/* Invalid JSON uses the same validation contract as other malformed bodies. */
	}
	throw new EnrollmentValidationError([{ field: 'body', message: 'A JSON object is required.' }]);
}
function failure(c: Context, error: unknown, creating = false): Response {
	if (error instanceof EnrollmentValidationError) return c.json({ error: { code: 'INVALID_REQUEST', message: error.message, details: error.details } }, 400);
	if (error instanceof EnrollmentConflictError) return c.json({ error: { code: error.code, message: error.message, details: [] } }, 409);
	if (error instanceof NotFoundError) return c.json({ error: { code: creating ? 'COURSE_NOT_FOUND' : 'ENROLLMENT_REQUEST_NOT_FOUND', message: error.message, details: [] } }, 404);
	throw error;
}
export function registerEnrollmentRequests(app: Hono, factory: ApplicationServicesFactory): void {
	app.post('/api/enrollment-requests', async (c) => {
		try {
			const input = await body(c);
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Training.EnrollmentRequest.create({ courseId: text(input.courseId), learnerEmail: text(input.learnerEmail), justification: text(input.justification) }), 201);
		} catch (error) {
			return failure(c, error, true);
		}
	});
	app.get('/api/enrollment-requests', async (c) => {
		try {
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Training.EnrollmentRequest.queryRequests({ status: c.req.query('status'), courseId: c.req.query('courseId'), learnerEmail: c.req.query('learnerEmail') }));
		} catch (error) {
			return failure(c, error);
		}
	});
	app.get('/api/enrollment-requests/:id', async (c) => {
		try {
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Training.EnrollmentRequest.getById(c.req.param('id')));
		} catch (error) {
			return failure(c, error);
		}
	});
	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		try {
			const input = await body(c);
			if (input.reason !== undefined && typeof input.reason !== 'string') throw new EnrollmentValidationError([{ field: 'reason', message: 'reason must be a string.' }]);
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Training.EnrollmentRequest.update(c.req.param('id'), { status: text(input.status), changedBy: text(input.changedBy), reason: input.reason as string | undefined }));
		} catch (error) {
			return failure(c, error);
		}
	});
}
