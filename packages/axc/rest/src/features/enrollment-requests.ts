import type { ApplicationServicesFactory, ChangeStatusCommand, CreateEnrollmentRequestCommand } from '@axc/application-services';
import { ApplicationError } from '@axc/application-services';
import type { Hono } from 'hono';
import { respondWithError } from './errors.ts';

const body = async (request: Request): Promise<Record<string, unknown>> => {
	try {
		const parsed: unknown = await request.json();
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
	} catch {
		/* handled below */
	}
	throw new ApplicationError('INVALID_REQUEST', [{ field: 'body', message: 'A JSON object is required.' }]);
};
export const registerEnrollmentRequests = (app: Hono, factory: ApplicationServicesFactory) => {
	app.post('/api/enrollment-requests', async (c) => {
		try {
			const input = await body(c.req.raw);
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Enrollment.EnrollmentRequest.create(input as unknown as CreateEnrollmentRequestCommand), 201);
		} catch (error) {
			return respondWithError(c, error);
		}
	});
	app.get('/api/enrollment-requests', async (c) => {
		try {
			const params = new URL(c.req.url).searchParams;
			const details: { field: string; message: string }[] = [];
			for (const key of params.keys()) if (!['status', 'courseId', 'learnerEmail'].includes(key) || params.getAll(key).length !== 1) details.push({ field: key, message: 'Unknown or repeated query parameter.' });
			if (details.length) throw new ApplicationError('INVALID_REQUEST', details);
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Enrollment.EnrollmentRequest.list({ status: params.get('status') ?? undefined, courseId: params.get('courseId') ?? undefined, learnerEmail: params.get('learnerEmail') ?? undefined }));
		} catch (error) {
			return respondWithError(c, error);
		}
	});
	app.get('/api/enrollment-requests/:id', async (c) => {
		try {
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Enrollment.EnrollmentRequest.getById(c.req.param('id')));
		} catch (error) {
			return respondWithError(c, error);
		}
	});
	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		try {
			const input = await body(c.req.raw);
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Enrollment.EnrollmentRequest.changeStatus(c.req.param('id'), input as unknown as ChangeStatusCommand));
		} catch (error) {
			return respondWithError(c, error);
		}
	});
};
