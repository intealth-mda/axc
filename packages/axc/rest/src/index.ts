import { type ApplicationServices, type ApplicationServicesFactory, type CourseQueryInput, unreadableEnrollmentRequestBody } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		const result = await applicationServices.courses.search(collectQuery(c.req.url));
		if (!result.ok) {
			return c.json(result.body, 400);
		}
		return c.json(result.body);
	});

	app.post('/api/enrollment-requests', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		const body = await readJsonBody(c.req);
		if (!body.ok) {
			return c.json(unreadableEnrollmentRequestBody(), 400);
		}
		const result = await applicationServices.enrollmentRequests.create(body.value);
		return c.json(result.body, result.status);
	});

	app.get('/api/enrollment-requests', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		const result = await applicationServices.enrollmentRequests.list(collectQuery(c.req.url));
		return c.json(result.body, result.status);
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		const result = await applicationServices.enrollmentRequests.getById(c.req.param('id'));
		return c.json(result.body, result.status);
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		const body = await readJsonBody(c.req);
		if (!body.ok) {
			return c.json(unreadableEnrollmentRequestBody(), 400);
		}
		const result = await applicationServices.enrollmentRequests.updateStatus(c.req.param('id'), body.value);
		return c.json(result.body, result.status);
	});

	return app;
}

async function applicationServicesFor(applicationServicesFactory: ApplicationServicesFactory, authorization: string | undefined): Promise<ApplicationServices> {
	if (authorization === undefined) {
		return await applicationServicesFactory.forRequest();
	}
	return await applicationServicesFactory.forRequest(authorization);
}

async function readJsonBody(request: { json(): Promise<unknown> }): Promise<{ readonly ok: true; readonly value: unknown } | { readonly ok: false }> {
	try {
		return { ok: true, value: await request.json() };
	} catch {
		return { ok: false };
	}
}

function collectQuery(rawUrl: string): CourseQueryInput {
	const params = requestUrl(rawUrl).searchParams;
	const query: Record<string, string[]> = {};
	for (const key of params.keys()) {
		if (query[key] === undefined) {
			query[key] = params.getAll(key);
		}
	}
	return query;
}

function requestUrl(rawUrl: string): URL {
	if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
		return new URL(rawUrl);
	}
	return new URL(rawUrl, 'http://localhost');
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
