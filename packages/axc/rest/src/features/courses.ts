import type { ApplicationServicesFactory, CourseSearchQuery } from '@axc/application-services';
import { ApplicationError } from '@axc/application-services';
import type { Hono } from 'hono';
import { respondWithError } from './errors.ts';
export const registerCourses = (app: Hono, factory: ApplicationServicesFactory) => {
	app.get('/api/courses', async (c) => {
		try {
			const params = new URL(c.req.url).searchParams;
			const allowed = new Set(['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort']);
			const details: { field: string; message: string }[] = [];
			for (const key of params.keys()) if (!allowed.has(key) || params.getAll(key).length !== 1) details.push({ field: key, message: 'Unknown or repeated query parameter.' });
			const parseInteger = (key: string) => {
				const raw = params.get(key);
				if (raw === null) return undefined;
				if (!/^[0-9]+$/.test(raw)) {
					details.push({ field: key, message: `${key} must be a positive integer.` });
					return undefined;
				}
				return Number(raw);
			};
			const query: CourseSearchQuery = {
				q: params.get('q') ?? undefined,
				modality: params.get('modality') ?? undefined,
				status: params.get('status') ?? undefined,
				tag: params.get('tag') ?? undefined,
				page: parseInteger('page'),
				pageSize: parseInteger('pageSize'),
				sort: params.get('sort') ?? undefined,
			};
			if (details.length) throw new ApplicationError('INVALID_QUERY_PARAMETER', details);
			const services = await factory.forRequest(c.req.header('Authorization'));
			return c.json(await services.Catalog.Course.search(query));
		} catch (error) {
			return respondWithError(c, error);
		}
	});
};
