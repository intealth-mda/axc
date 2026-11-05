import { type ApplicationServicesFactory, ServiceError, type ServiceErrorCode } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { type Context, Hono } from 'hono';

const STATUS: Record<ServiceErrorCode, 400 | 404 | 409> = {
	INVALID_QUERY_PARAMETER: 400,
	INVALID_REQUEST: 400,
	COURSE_NOT_FOUND: 404,
	ENROLLMENT_REQUEST_NOT_FOUND: 404,
	COURSE_NOT_ACTIVE: 409,
	DUPLICATE_ACTIVE_REQUEST: 409,
	INVALID_STATUS_TRANSITION: 409,
};

const jsonBody = (c: Context): Promise<unknown> =>
	c.req.json().catch(() => {
		throw new ServiceError('INVALID_REQUEST', 'Request body must be valid JSON.');
	});

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();
	const services = (c: Context) => applicationServicesFactory.forRequest(c.req.header('Authorization'));

	app.onError((err, c) => {
		if (err instanceof ServiceError) {
			return c.json({ error: { code: err.code, message: err.message, details: err.details } }, STATUS[err.code]);
		}
		return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.', details: [] } }, 500);
	});

	app.get('/health', async (c) => c.json((await services(c)).health.getStatus()));
	app.get('/api/courses', async (c) => c.json(await (await services(c)).courses.search(c.req.query())));
	app.post('/api/enrollment-requests', async (c) => c.json(await (await services(c)).enrollmentRequests.create(await jsonBody(c)), 201));
	app.get('/api/enrollment-requests', async (c) => c.json(await (await services(c)).enrollmentRequests.list(c.req.query())));
	app.get('/api/enrollment-requests/:id', async (c) => c.json(await (await services(c)).enrollmentRequests.get(c.req.param('id'))));
	app.patch('/api/enrollment-requests/:id/status', async (c) => c.json(await (await services(c)).enrollmentRequests.changeStatus(c.req.param('id'), await jsonBody(c))));

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
