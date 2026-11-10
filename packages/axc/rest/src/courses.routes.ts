import type { ApplicationServicesFactory } from '@axc/application-services';
import type { Hono } from 'hono';

export function registerCourseRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const outcome = await applicationServices.course.search(searchString(c.req.url));
		if (!outcome.ok) {
			return c.json(outcome.body, 400);
		}
		return c.json(outcome.body);
	});
}

function searchString(requestUrl: string): string {
	const queryIndex = requestUrl.indexOf('?');
	if (queryIndex === -1) {
		return '';
	}
	const hashIndex = requestUrl.indexOf('#', queryIndex);
	if (hashIndex === -1) {
		return requestUrl.slice(queryIndex + 1);
	}
	return requestUrl.slice(queryIndex + 1, hashIndex);
}
