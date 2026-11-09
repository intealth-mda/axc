import { type ApplicationServicesFactory, invalid, parseChangeStatus, parseCreate, ServiceError, type ServiceErrorCode } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { type Context, Hono } from 'hono';

const STATUS: Record<ServiceErrorCode, 400 | 404 | 409> = {
	INVALID_REQUEST: 400,
	COURSE_NOT_FOUND: 404,
	ENROLLMENT_REQUEST_NOT_FOUND: 404,
	COURSE_NOT_ACTIVE: 409,
	DUPLICATE_ACTIVE_REQUEST: 409,
	INVALID_STATUS_TRANSITION: 409,
};

const services = (factory: ApplicationServicesFactory, c: Context) => {
	const authorization = c.req.header('Authorization');
	return authorization === undefined ? factory.forRequest() : factory.forRequest(authorization);
};
const json = (c: Context): Promise<unknown> => c.req.json().catch(() => Promise.reject(invalid([{ field: 'body', message: 'body must be valid JSON.' }])));

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();
	const svc = (c: Context) => services(applicationServicesFactory, c);

	app.onError((err, c) => {
		if (err instanceof ServiceError) return c.json({ error: { code: err.code, message: err.message, details: err.details } }, STATUS[err.code]);
		throw err;
	});

	app.get('/health', async (c) => c.json((await svc(c)).health.getStatus()));
	app.get('/api/courses', async (c) => c.json(await (await svc(c)).courses.search(c.req.query())));
	app.post('/api/enrollment-requests', async (c) => c.json(await (await svc(c)).enrollmentRequests.create(parseCreate(await json(c))), 201));
	app.get('/api/enrollment-requests', async (c) => c.json(await (await svc(c)).enrollmentRequests.list(c.req.query())));
	app.get('/api/enrollment-requests/:id', async (c) => c.json(await (await svc(c)).enrollmentRequests.get(c.req.param('id'))));
	app.patch('/api/enrollment-requests/:id/status', async (c) => c.json(await (await svc(c)).enrollmentRequests.changeStatus(c.req.param('id'), parseChangeStatus(await json(c)))));

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
