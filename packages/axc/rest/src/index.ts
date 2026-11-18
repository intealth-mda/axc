import { type ApplicationServicesFactory, ServiceError, type ServiceErrorCode } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

const STATUS: Record<ServiceErrorCode, 400 | 404 | 409> = {
	INVALID_QUERY_PARAMETER: 400,
	INVALID_REQUEST: 400,
	COURSE_NOT_FOUND: 404,
	ENROLLMENT_REQUEST_NOT_FOUND: 404,
	COURSE_NOT_ACTIVE: 409,
	DUPLICATE_ACTIVE_REQUEST: 409,
	INVALID_STATUS_TRANSITION: 409,
};

const jsonBody = (req: { json(): Promise<unknown> }): Promise<unknown> =>
	req.json().catch(() => {
		throw new ServiceError('INVALID_REQUEST', 'The request could not be completed.', [{ field: 'body', message: 'body must be valid JSON.' }]);
	});

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return c.json(applicationServices.health.getStatus());
	});

	const services = (c: { req: { header(name: string): string | undefined } }) => {
		const authorization = c.req.header('Authorization');
		return authorization === undefined ? applicationServicesFactory.forRequest() : applicationServicesFactory.forRequest(authorization);
	};
	app.get('/api/courses', async (c) => c.json(await (await services(c)).courses.search(c.req.query())));
	app.post('/api/enrollment-requests', async (c) => c.json(await (await services(c)).enrollmentRequests.create(await jsonBody(c.req)), 201));
	app.get('/api/enrollment-requests', async (c) => c.json(await (await services(c)).enrollmentRequests.list(c.req.query())));
	app.get('/api/enrollment-requests/:id', async (c) => c.json(await (await services(c)).enrollmentRequests.getById(c.req.param('id'))));
	app.patch('/api/enrollment-requests/:id/status', async (c) => c.json(await (await services(c)).enrollmentRequests.changeStatus(c.req.param('id'), await jsonBody(c.req))));

	app.onError((err, c) => {
		if (err instanceof ServiceError) return c.json({ error: { code: err.code, message: err.message, details: err.details } }, STATUS[err.code]);
		throw err;
	});

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
