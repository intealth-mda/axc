import type { ApplicationServicesFactory, ServiceError } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();
	const servicesFor = (authorization: string | undefined) => (authorization === undefined ? applicationServicesFactory.forRequest() : applicationServicesFactory.forRequest(authorization));

	app.get('/health', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'));
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'));
		const result = await applicationServices.courses.search({
			q: c.req.query('q'),
			modality: c.req.query('modality'),
			status: c.req.query('status'),
			tag: c.req.query('tag'),
			page: c.req.query('page'),
			pageSize: c.req.query('pageSize'),
			sort: c.req.query('sort'),
		});
		if (!result.ok) {
			return c.json(errorBody(result.error), result.error.status);
		}
		return c.json(result.value);
	});

	app.get('/api/enrollment-requests', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'));
		const result = await applicationServices.enrollmentRequests.list({
			status: c.req.query('status'),
			courseId: c.req.query('courseId'),
			learnerEmail: c.req.query('learnerEmail'),
		});
		if (!result.ok) {
			return c.json(errorBody(result.error), result.error.status);
		}
		return c.json(result.value);
	});

	app.post('/api/enrollment-requests', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'));
		const result = await applicationServices.enrollmentRequests.create(await readJson(c));
		if (!result.ok) {
			return c.json(errorBody(result.error), result.error.status);
		}
		return c.json(result.value, 201);
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'));
		const result = await applicationServices.enrollmentRequests.updateStatus(c.req.param('id'), await readJson(c));
		if (!result.ok) {
			return c.json(errorBody(result.error), result.error.status);
		}
		return c.json(result.value);
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		const applicationServices = await servicesFor(c.req.header('Authorization'));
		const result = await applicationServices.enrollmentRequests.getById(c.req.param('id'));
		if (!result.ok) {
			return c.json(errorBody(result.error), result.error.status);
		}
		return c.json(result.value);
	});

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};

async function readJson(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
	try {
		return await c.req.json();
	} catch {
		return undefined;
	}
}

function errorBody(error: ServiceError) {
	return {
		error: {
			code: error.code,
			message: error.message,
			details: error.details,
		},
	};
}
