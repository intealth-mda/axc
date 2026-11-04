import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

type CatalogFailure = {
	ok: false;
	status: 400 | 404 | 409;
	error: { code: string; message: string; details: { field: string; message: string }[] };
};
type CatalogSuccess<T> = { ok: true; value: T };
type CatalogResult<T> = CatalogSuccess<T> | CatalogFailure;

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const applicationServices = await applicationServicesFor(c.req.header('Authorization'), applicationServicesFactory);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const applicationServices = await applicationServicesFor(c.req.header('Authorization'), applicationServicesFactory);
		return sendResult(c, await applicationServices.courses.search(c.req.query()));
	});

	app.get('/api/enrollment-requests', async (c) => {
		const applicationServices = await applicationServicesFor(c.req.header('Authorization'), applicationServicesFactory);
		const result = await applicationServices.enrollmentRequests.list(c.req.query());
		if (!result.ok) {
			return c.json({ error: result.error }, result.status);
		}
		return c.json({ items: result.value });
	});

	app.post('/api/enrollment-requests', async (c) => {
		const body = await readJsonBody(c);
		if (body instanceof Response) {
			return body;
		}
		const applicationServices = await applicationServicesFor(c.req.header('Authorization'), applicationServicesFactory);
		return sendResult(c, await applicationServices.enrollmentRequests.create(body), 201);
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		const applicationServices = await applicationServicesFor(c.req.header('Authorization'), applicationServicesFactory);
		return sendResult(c, await applicationServices.enrollmentRequests.getById(c.req.param('id')));
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const body = await readJsonBody(c);
		if (body instanceof Response) {
			return body;
		}
		const applicationServices = await applicationServicesFor(c.req.header('Authorization'), applicationServicesFactory);
		return sendResult(c, await applicationServices.enrollmentRequests.updateStatus(c.req.param('id'), body));
	});

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};

async function applicationServicesFor(authorization: string | undefined, applicationServicesFactory: ApplicationServicesFactory) {
	return authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
}

async function readJsonBody(c: { req: { json: () => Promise<unknown> }; json: (body: unknown, status: 400) => Response }): Promise<unknown | Response> {
	try {
		return await c.req.json();
	} catch {
		return c.json(
			{
				error: {
					code: 'INVALID_REQUEST',
					message: 'The request could not be completed.',
					details: [{ field: 'body', message: 'Request body must be JSON.' }],
				},
			},
			400,
		);
	}
}

function sendResult<T>(c: { json: (body: unknown, status?: 200 | 201 | 400 | 404 | 409) => Response }, result: CatalogResult<T>, successStatus: 200 | 201 = 200): Response {
	if (!result.ok) {
		return c.json({ error: result.error }, result.status);
	}
	return c.json(result.value, successStatus);
}
