import type { ApplicationServicesFactory, EnrollmentErrorCode, EnrollmentResult } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { type Context, Hono } from 'hono';

function errorStatus(code: EnrollmentErrorCode): 400 | 404 | 409 {
	if (code === 'INVALID_REQUEST') {
		return 400;
	}
	return code === 'COURSE_NOT_FOUND' || code === 'ENROLLMENT_REQUEST_NOT_FOUND' ? 404 : 409;
}

function respond<T extends object>(c: Context, result: EnrollmentResult<T>, successStatus: 200 | 201 = 200): Response {
	return result.ok ? c.json(result.value, successStatus) : c.json({ error: result.error }, errorStatus(result.error.code));
}

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono({ strict: false });

	app.get('/health', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const result = applicationServices.courses.search(c.req.query());
		if (result.ok) {
			return c.json(result.value);
		}
		return c.json({ error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details: result.errors } }, 400);
	});

	const enrollmentRequests = async (c: Context) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return applicationServices.enrollmentRequests;
	};
	// A missing or malformed body reaches the service as undefined, which rejects it with 400.
	const jsonBody = (c: Context): Promise<unknown> => c.req.json().catch(() => undefined);

	app.post('/api/enrollment-requests', async (c) => {
		const service = await enrollmentRequests(c);
		return respond(c, service.create(await jsonBody(c)), 201);
	});

	app.get('/api/enrollment-requests', async (c) => {
		const service = await enrollmentRequests(c);
		const result = service.list(c.req.query());
		return result.ok ? c.json({ items: result.value }) : respond(c, result);
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		const service = await enrollmentRequests(c);
		return respond(c, service.get(c.req.param('id')));
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const service = await enrollmentRequests(c);
		return respond(c, service.updateStatus(c.req.param('id'), await jsonBody(c)));
	});

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
