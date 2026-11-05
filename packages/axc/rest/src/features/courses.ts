import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import type { Context } from 'hono';
export const coursesHandler =
	(factory: ApplicationServicesFactory) =>
	async (c: Context): Promise<Response> => {
		const params = c.req.queries();
		const allowed = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'];
		const details: { field: string; message: string }[] = [];
		for (const [field, values] of Object.entries(params)) {
			if (!allowed.includes(field)) details.push({ field, message: 'Unknown query parameter.' });
			if (values.length !== 1) details.push({ field, message: 'Query parameter must appear once.' });
		}
		const integer = (field: string, fallback: number) => {
			const value = c.req.query(field);
			return value === undefined ? fallback : /^\d+$/.test(value) ? Number(value) : Number.NaN;
		};
		const query: Domain.Contexts.Catalog.Course.CourseSearchQuery = { page: integer('page', 1), pageSize: integer('pageSize', 10), sort: c.req.query('sort') ?? 'title' };
		for (const field of ['q', 'modality', 'status', 'tag'] as const) {
			const value = c.req.query(field);
			if (value !== undefined) query[field] = value;
		}
		details.push(...Domain.Contexts.Catalog.Course.validateCourseQuery(query));
		if (details.length) return c.json({ error: { code: 'INVALID_QUERY_PARAMETER', message: 'One or more query parameters are invalid.', details } }, 400);
		const services = await factory.forRequest(c.req.header('Authorization'));
		return c.json(await services.Catalog.Course.queryCourses(query));
	};
