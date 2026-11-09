import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import type { Hono } from 'hono';

const integer = (value: string | undefined, fallback: number) => (value === undefined ? fallback : /^\d+$/.test(value) ? Number(value) : Number.NaN);
export function registerCourses(app: Hono, factory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const params = c.req.queries();
		const allowed = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'];
		const query = {
			q: c.req.query('q'),
			modality: c.req.query('modality'),
			status: c.req.query('status'),
			tag: c.req.query('tag'),
			page: integer(c.req.query('page'), 1),
			pageSize: integer(c.req.query('pageSize'), 10),
			sort: c.req.query('sort') ?? 'title',
			invalidFields: Object.keys(params).filter((key) => !allowed.includes(key) || (params[key]?.length ?? 0) > 1),
		};
		try {
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Catalog.Course.queryCourses(query));
		} catch (error) {
			if (error instanceof Domain.Contexts.Catalog.Course.CourseValidationError) return c.json({ error: { code: 'INVALID_QUERY_PARAMETER', message: error.message, details: error.details } }, 400);
			throw error;
		}
	});
}
