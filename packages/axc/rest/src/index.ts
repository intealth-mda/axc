import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const q = c.req.query('q');
		const modality = c.req.query('modality');
		const status = c.req.query('status');
		const tag = c.req.query('tag');
		const pageRaw = c.req.query('page');
		const pageSizeRaw = c.req.query('pageSize');
		const sort = c.req.query('sort');
		const modalities = ['online', 'in-person', 'hybrid'] as const;
		const statuses = ['draft', 'active', 'retired'] as const;
		const sorts = ['title', 'createdAt', 'updatedAt'] as const;
		const details: { field: string; message: string }[] = [];
		const isListed = (value: string, allowed: readonly string[]): boolean => allowed.includes(value);
		const isWholeNumber = (value: string): boolean => /^[1-9]\d*$/.test(value);
		if (modality !== undefined && !isListed(modality, modalities)) {
			details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
		}
		if (status !== undefined && !isListed(status, statuses)) {
			details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
		}
		if (sort !== undefined && !isListed(sort, sorts)) {
			details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
		}
		if (pageRaw !== undefined && (!isWholeNumber(pageRaw) || Number(pageRaw) < 1)) {
			details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		}
		if (pageSizeRaw !== undefined && (!isWholeNumber(pageSizeRaw) || Number(pageSizeRaw) < 1 || Number(pageSizeRaw) > 50)) {
			details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		}
		if (details.length > 0) {
			return c.json(
				{
					error: {
						code: 'INVALID_QUERY_PARAMETER',
						message: 'One or more query parameters are invalid.',
						details,
					},
				},
				400,
			);
		}
		const page = pageRaw === undefined ? 1 : Number(pageRaw);
		const pageSize = pageSizeRaw === undefined ? 10 : Number(pageSizeRaw);
		const modalityValue = modality === 'online' || modality === 'in-person' || modality === 'hybrid' ? modality : undefined;
		const statusValue = status === 'draft' || status === 'active' || status === 'retired' ? status : undefined;
		const sortValue = sort === 'title' || sort === 'createdAt' || sort === 'updatedAt' ? sort : 'title';
		try {
			const courses = await applicationServices.Catalog.Course.search({
				...(q === undefined ? {} : { q }),
				...(modalityValue === undefined ? {} : { modality: modalityValue }),
				...(statusValue === undefined ? {} : { status: statusValue }),
				...(tag === undefined ? {} : { tag }),
				page,
				pageSize,
				sort: sortValue,
			});
			const totalItems = courses.length;
			const start = (page - 1) * pageSize;
			const items = courses.slice(start, start + pageSize).map((course) => ({
				id: course.id,
				title: course.title,
				summary: course.summary,
				modality: course.modality,
				status: course.status,
				tags: course.tags,
				createdAt: course.createdAt.toISOString(),
				updatedAt: course.updatedAt.toISOString(),
			}));
			return c.json({
				items,
				page,
				pageSize,
				totalItems,
				totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
			});
		} catch (error) {
			let failure: unknown = error;
			for (let depth = 0; depth < 5 && typeof failure === 'object' && failure !== null && !('status' in failure); depth += 1) {
				failure = 'cause' in failure ? failure.cause : undefined;
			}
			const status = typeof failure === 'object' && failure !== null && 'status' in failure ? failure.status : undefined;
			const message = failure instanceof Error ? failure.message : error instanceof Error ? error.message : '';
			if (status === 400) return c.json({ message }, 400);
			if (status === 404) return c.json({ message }, 404);
			if (status === 409) return c.json({ message }, 409);
			throw error;
		}
	});
	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
