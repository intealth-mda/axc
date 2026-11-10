import type { ApplicationServicesFactory, CourseQueryInput } from '@axc/application-services';
import type { Hono } from 'hono';

export function registerCourseRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const outcome = await applicationServices.course.query(readCourseQueryInput((key) => c.req.query(key)));
		if (!outcome.ok) {
			return c.json({ error: outcome.error }, 400);
		}
		return c.json(outcome.result);
	});
}

function readCourseQueryInput(read: (key: string) => string | undefined): CourseQueryInput {
	const q = read('q');
	const modality = read('modality');
	const status = read('status');
	const tag = read('tag');
	const page = read('page');
	const pageSize = read('pageSize');
	const sort = read('sort');
	return {
		...(q === undefined ? {} : { q }),
		...(modality === undefined ? {} : { modality }),
		...(status === undefined ? {} : { status }),
		...(tag === undefined ? {} : { tag }),
		...(page === undefined ? {} : { page }),
		...(pageSize === undefined ? {} : { pageSize }),
		...(sort === undefined ? {} : { sort }),
	};
}
