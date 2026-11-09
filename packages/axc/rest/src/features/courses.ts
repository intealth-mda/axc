import { type ApplicationServicesFactory, type CourseSearchQuery, InvalidCourseQueryError } from '@axc/application-services';
import type { Hono } from 'hono';
export function registerCourses(app: Hono, factory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		try {
			const params = new URL(c.req.url).searchParams;
			const query: Record<string, string | number> = Object.create(null);
			for (const [field, value] of params) {
				if (params.getAll(field).length !== 1) throw new InvalidCourseQueryError([{ field, message: 'Provide this parameter only once.' }]);
				query[field] = field === 'page' || field === 'pageSize' ? (/^[0-9]+$/.test(value) ? Number(value) : Number.NaN) : value;
			}
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Catalog.Course.search(query as CourseSearchQuery));
		} catch (error) {
			if (error instanceof InvalidCourseQueryError) return c.json({ error: { code: error.code, message: error.message, details: error.details } }, 400);
			throw error;
		}
	});
}
