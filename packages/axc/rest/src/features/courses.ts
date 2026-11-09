import type { ApplicationServicesFactory } from '@axc/application-services';
import { Domain } from '@axc/domain';
import type { Hono } from 'hono';

const integer = (value: string | undefined, fallback: number): number => (value === undefined ? fallback : /^\d+$/.test(value) ? Number(value) : Number.NaN);
export function registerCourses(app: Hono, factory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		try {
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(
				await services.Training.Course.queryCourses({
					q: c.req.query('q'),
					modality: c.req.query('modality'),
					status: c.req.query('status'),
					tag: c.req.query('tag'),
					page: integer(c.req.query('page'), 1),
					pageSize: integer(c.req.query('pageSize'), 10),
					sort: c.req.query('sort') ?? 'title',
				}),
			);
		} catch (error) {
			if (error instanceof Domain.Contexts.Training.Course.CourseValidationError) return c.json({ error: { code: 'INVALID_QUERY_PARAMETER', message: error.message, details: error.details } }, 400);
			throw error;
		}
	});
}
