import { type ApplicationServicesFactory, InvalidCourseQueryError } from '@axc/application-services';
import type { Hono } from 'hono';

export function registerCourseRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		try {
			const page = await applicationServices.course.searchCourses(c.req.queries());
			return c.json(page);
		} catch (error) {
			if (error instanceof InvalidCourseQueryError) {
				return c.json(
					{
						error: {
							code: InvalidCourseQueryError.code,
							message: InvalidCourseQueryError.messageText,
							details: error.details.map((detail) => ({ field: detail.field, message: detail.message })),
						},
					},
					400,
				);
			}
			throw error;
		}
	});
}
