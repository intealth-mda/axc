import { type ApplicationServicesFactory, type CourseQueryErrorBody, courseQueryErrorBody, InvalidCourseQueryError, type RawCourseQuery } from '@axc/application-services';
import type { Hono } from 'hono';

interface QueryReader {
	query(name: string): string | undefined;
}

function readRawCourseQuery(query: QueryReader): RawCourseQuery {
	const raw: {
		q?: string;
		modality?: string;
		status?: string;
		tag?: string;
		page?: string;
		pageSize?: string;
		sort?: string;
	} = {};
	const q = query.query('q');
	const modality = query.query('modality');
	const status = query.query('status');
	const tag = query.query('tag');
	const page = query.query('page');
	const pageSize = query.query('pageSize');
	const sort = query.query('sort');
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
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		try {
			const page = await applicationServices.course.search(readRawCourseQuery(c.req));
			return c.json(page);
		} catch (error) {
			if (error instanceof InvalidCourseQueryError) {
				const body: CourseQueryErrorBody = courseQueryErrorBody(error.details);
				return c.json(body, 400);
			}
			throw error;
		}
	});
}
