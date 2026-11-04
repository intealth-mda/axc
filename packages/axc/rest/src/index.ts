import { ApplicationError, type ApplicationServicesFactory, applicationErrorStatus } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { type Context, Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const applicationServices = await servicesFor(applicationServicesFactory, c);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', (c) => send(c, 200, async () => (await servicesFor(applicationServicesFactory, c)).courses.search(c.req.query())));

	app.post('/api/enrollment-requests', (c) => send(c, 201, async () => (await servicesFor(applicationServicesFactory, c)).enrollmentRequests.create(await readBody(c))));

	app.get('/api/enrollment-requests', (c) => send(c, 200, async () => (await servicesFor(applicationServicesFactory, c)).enrollmentRequests.list(c.req.query())));

	app.patch('/api/enrollment-requests/:id/status', (c) => send(c, 200, async () => (await servicesFor(applicationServicesFactory, c)).enrollmentRequests.updateStatus(c.req.param('id'), await readBody(c))));

	app.get('/api/enrollment-requests/:id', (c) => send(c, 200, async () => (await servicesFor(applicationServicesFactory, c)).enrollmentRequests.get(c.req.param('id'))));

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};

async function servicesFor(applicationServicesFactory: ApplicationServicesFactory, c: Context) {
	const authorization = c.req.header('Authorization');
	return authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
}

async function send(c: Context, status: 200 | 201, action: () => Promise<unknown>) {
	try {
		return c.json(await action(), status);
	} catch (error) {
		if (error instanceof ApplicationError) {
			return c.json({ error: { code: error.code, message: error.message, details: error.details } }, applicationErrorStatus[error.code]);
		}
		throw error;
	}
}

async function readBody(c: Context): Promise<unknown> {
	try {
		return await c.req.json();
	} catch {
		throw new ApplicationError('INVALID_REQUEST', 'The request could not be completed.', [{ field: 'body', message: 'Request body must be JSON.' }]);
	}
}
