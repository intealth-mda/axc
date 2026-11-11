import { type ApplicationServicesFactory, ServiceError, type ServiceErrorCode } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const services = await applicationServicesFactory.forRequest();
		return c.json(await services.courses.list(c.req.query()));
	});

	app.onError((err, c) => {
		if (err instanceof ServiceError) {
			return c.json({ error: { code: err.code, message: err.message, details: err.details } }, statusByCode[err.code]);
		}
		throw err;
	});

	return app;
}

const statusByCode: Record<ServiceErrorCode, 400> = { INVALID_QUERY_PARAMETER: 400 };

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
