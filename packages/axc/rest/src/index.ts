import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'), applicationServicesFactory);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'), applicationServicesFactory);
		const outcome = await applicationServices.courses.search(c.req.queries());
		if (!outcome.ok) {
			return c.json(outcome.body, 400);
		}
		return c.json(outcome.body);
	});

	app.post('/api/enrollment-requests', async (c) => {
		const body = await readJsonBody(c.req);
		const applicationServices = await servicesFor(c.req.header('Authorization'), applicationServicesFactory);
		const outcome = await applicationServices.enrollmentRequests.create(body);
		return c.json(outcome.body, outcome.status);
	});

	app.get('/api/enrollment-requests', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'), applicationServicesFactory);
		const outcome = await applicationServices.enrollmentRequests.list(c.req.queries());
		return c.json(outcome.body, outcome.status);
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const body = await readJsonBody(c.req);
		const applicationServices = await servicesFor(c.req.header('Authorization'), applicationServicesFactory);
		const outcome = await applicationServices.enrollmentRequests.updateStatus(c.req.param('id'), body);
		return c.json(outcome.body, outcome.status);
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'), applicationServicesFactory);
		const outcome = await applicationServices.enrollmentRequests.getById(c.req.param('id'));
		return c.json(outcome.body, outcome.status);
	});

	return app;
}

async function readJsonBody(request: { json(): Promise<unknown> }): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		return undefined;
	}
}

function servicesFor(authorization: string | undefined, applicationServicesFactory: ApplicationServicesFactory) {
	if (authorization === undefined) {
		return applicationServicesFactory.forRequest();
	}
	return applicationServicesFactory.forRequest(authorization);
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
