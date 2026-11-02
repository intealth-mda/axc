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
		const details = invalidCourseQuery(c.req.query());
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
		const q = c.req.query('q');
		const pageValue = c.req.query('page');
		const pageSizeValue = c.req.query('pageSize');
		const sortValue = c.req.query('sort');
		const modality = c.req.query('modality');
		const status = c.req.query('status');
		const tag = c.req.query('tag');
		const page = pageValue === undefined ? 1 : Number(pageValue);
		const pageSize = pageSizeValue === undefined ? 10 : Number(pageSizeValue);
		const sort = sortValue === undefined ? 'title' : sortValue;
		const matches = await applicationServices.Catalog.Course.searchCourses({
			...(q === undefined ? {} : { q }),
			...(modality === undefined ? {} : { modality: modality as 'online' | 'in-person' | 'hybrid' }),
			...(status === undefined ? {} : { status: status as 'draft' | 'active' | 'retired' }),
			...(tag === undefined ? {} : { tag }),
			page,
			pageSize,
			sort: sort as 'title' | 'createdAt' | 'updatedAt',
		});
		const totalItems = matches.length;
		const start = (page - 1) * pageSize;
		return c.json({
			items: matches.slice(start, start + pageSize).map((course) => ({
				id: course.id,
				title: course.title,
				summary: course.summary,
				modality: course.modality,
				status: course.status,
				tags: course.tags,
				createdAt: course.createdAt.toISOString(),
				updatedAt: course.updatedAt.toISOString(),
			})),
			page,
			pageSize,
			totalItems,
			totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
		});
	});

	return app;
}

const courseModalities = ['online', 'in-person', 'hybrid'];
const courseStatuses = ['draft', 'active', 'retired'];
const courseSorts = ['title', 'createdAt', 'updatedAt'];
const courseQueryFields = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'];

const invalidCourseQuery = (query: Record<string, string>): { field: string; message: string }[] => {
	const details: { field: string; message: string }[] = [];
	for (const field of Object.keys(query)) {
		if (!courseQueryFields.includes(field)) {
			details.push({ field, message: `${field} is not a supported query parameter.` });
		}
	}
	const modality = query['modality'];
	if (modality !== undefined && !courseModalities.includes(modality)) {
		details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
	}
	const status = query['status'];
	if (status !== undefined && !courseStatuses.includes(status)) {
		details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
	}
	const page = query['page'];
	if (page !== undefined && !/^[1-9]\d*$/.test(page)) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
	}
	const pageSize = query['pageSize'];
	if (pageSize !== undefined && (!/^[1-9]\d*$/.test(pageSize) || Number(pageSize) > 50)) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
	}
	const sort = query['sort'];
	if (sort !== undefined && !courseSorts.includes(sort)) {
		details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
	}
	return details;
};

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
