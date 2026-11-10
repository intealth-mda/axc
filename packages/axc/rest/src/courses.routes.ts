import { type ApplicationServicesFactory, type CourseSearchRawQuery, INVALID_COURSE_QUERY_CODE, INVALID_COURSE_QUERY_MESSAGE, InvalidCourseQueryError } from '@axc/application-services';
import type { Hono } from 'hono';

export function registerCourseRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const raw = rawCourseQuery((name) => c.req.query(name));
		try {
			const authorization = c.req.header('Authorization');
			const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
			return c.json(await applicationServices.course.search(raw));
		} catch (error) {
			if (error instanceof InvalidCourseQueryError) {
				return c.json(
					{
						error: {
							code: INVALID_COURSE_QUERY_CODE,
							message: INVALID_COURSE_QUERY_MESSAGE,
							details: [...error.details],
						},
					},
					400,
				);
			}
			throw error;
		}
	});
}

function rawCourseQuery(query: (name: string) => string | undefined): CourseSearchRawQuery {
	const q = query('q');
	const modality = query('modality');
	const status = query('status');
	const tag = query('tag');
	const page = query('page');
	const pageSize = query('pageSize');
	const sort = query('sort');
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
