import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

const modalityValues = ['online', 'in-person', 'hybrid'] as const;
const statusValues = ['draft', 'active', 'retired'] as const;
const sortValues = ['title', 'createdAt', 'updatedAt'] as const;

type CourseModality = (typeof modalityValues)[number];
type CourseStatus = (typeof statusValues)[number];
type CourseSort = (typeof sortValues)[number];

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T => (values as readonly string[]).includes(value);

const integerInRange = (value: string, min: number, max: number): number | undefined => {
	if (!/^\d+$/.test(value)) return undefined;
	const parsed = Number(value);
	if (parsed < min || parsed > max) return undefined;
	return parsed;
};

const invalidQuery = (details: { field: string; message: string }[]) => ({
	error: {
		code: 'INVALID_QUERY_PARAMETER',
		message: 'One or more query parameters are invalid.',
		details,
	},
});

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
		const modalityQuery = c.req.query('modality');
		const statusQuery = c.req.query('status');
		const tag = c.req.query('tag');
		const pageQuery = c.req.query('page');
		const pageSizeQuery = c.req.query('pageSize');
		const sortQuery = c.req.query('sort');
		const details: { field: string; message: string }[] = [];
		const modality = modalityQuery === undefined ? undefined : isOneOf(modalityValues, modalityQuery) ? modalityQuery : undefined;
		const status = statusQuery === undefined ? undefined : isOneOf(statusValues, statusQuery) ? statusQuery : undefined;
		const sort = sortQuery === undefined ? 'title' : isOneOf(sortValues, sortQuery) ? sortQuery : undefined;
		const page = pageQuery === undefined ? 1 : integerInRange(pageQuery, 1, Number.MAX_SAFE_INTEGER);
		const pageSize = pageSizeQuery === undefined ? 10 : integerInRange(pageSizeQuery, 1, 50);
		if (modalityQuery !== undefined && modality === undefined) details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
		if (statusQuery !== undefined && status === undefined) details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
		if (sortQuery !== undefined && sort === undefined) details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
		if (page === undefined) details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		if (pageSize === undefined) details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		if (details.length > 0 || page === undefined || pageSize === undefined || sort === undefined) return c.json(invalidQuery(details), 400);
		try {
			const matches = await applicationServices.Catalog.Course.searchCourses({
				...(q === undefined ? {} : { q }),
				...(modality === undefined ? {} : { modality: modality as CourseModality }),
				...(status === undefined ? {} : { status: status as CourseStatus }),
				...(tag === undefined ? {} : { tag }),
				page,
				pageSize,
				sort: sort as CourseSort,
			});
			const start = ((page as number) - 1) * (pageSize as number);
			const items = matches.slice(start, start + (pageSize as number)).map((course) => ({
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
				totalItems: matches.length,
				totalPages: matches.length === 0 ? 0 : Math.ceil(matches.length / (pageSize as number)),
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
