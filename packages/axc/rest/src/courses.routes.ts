import { type ApplicationServicesFactory, parseCourseQuery, type RawCourseQuery } from '@axc/application-services';
import type { Context, Hono } from 'hono';

function readCourseQuery(c: Context): RawCourseQuery {
	const raw: { q?: string; modality?: string; status?: string; tag?: string; page?: string; pageSize?: string; sort?: string } = {};
	const q = c.req.query('q');
	const modality = c.req.query('modality');
	const status = c.req.query('status');
	const tag = c.req.query('tag');
	const page = c.req.query('page');
	const pageSize = c.req.query('pageSize');
	const sort = c.req.query('sort');
	if (q !== undefined) {
		raw.q = q;
	}
	if (modality !== undefined) {
		raw.modality = modality;
	}
	if (status !== undefined) {
		raw.status = status;
	}
	if (tag !== undefined) {
		raw.tag = tag;
	}
	if (page !== undefined) {
		raw.page = page;
	}
	if (pageSize !== undefined) {
		raw.pageSize = pageSize;
	}
	if (sort !== undefined) {
		raw.sort = sort;
	}
	return raw;
}

export function registerCourseRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const parsed = parseCourseQuery(readCourseQuery(c));
		if (!parsed.ok) {
			return c.json(parsed.error, 400);
		}
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return c.json(await applicationServices.course.findCourses(parsed.query));
	});
}
