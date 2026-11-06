import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import type { Hono } from 'hono';
export function registerCourses(app: Hono, factory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const integer = (field: string, fallback: number) => {
			const value = c.req.query(field);
			return value === undefined ? fallback : /^\d+$/.test(value) ? Number(value) : Number.NaN;
		};
		const q = c.req.query('q');
		const modality = c.req.query('modality');
		const status = c.req.query('status');
		const tag = c.req.query('tag');
		try {
			const authorization = c.req.header('Authorization');
			const services = authorization === undefined ? await factory.forRequest() : await factory.forRequest(authorization);
			return c.json(
				await services.Catalog.Course.queryCourses({
					...(q === undefined ? {} : { q }),
					...(modality === undefined ? {} : { modality }),
					...(status === undefined ? {} : { status }),
					...(tag === undefined ? {} : { tag }),
					page: integer('page', 1),
					pageSize: integer('pageSize', 10),
					sort: c.req.query('sort') ?? 'title',
				}),
			);
		} catch (error) {
			if (error instanceof Domain.Contexts.Catalog.Course.CourseValidationError) return c.json({ error: { code: 'INVALID_QUERY_PARAMETER', message: error.message, details: error.details } }, 400);
			throw error;
		}
	});
}
