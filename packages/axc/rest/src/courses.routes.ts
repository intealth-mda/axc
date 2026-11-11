import { type ApplicationServicesFactory, type CourseQueryFieldError, parseCourseSearchQuery } from '@axc/application-services';
import type { Hono } from 'hono';

interface CourseQueryErrorBody {
	error: {
		code: 'INVALID_QUERY_PARAMETER';
		message: 'One or more query parameters are invalid.';
		details: CourseQueryFieldError[];
	};
}

function invalidCourseQuery(details: readonly CourseQueryFieldError[]): CourseQueryErrorBody {
	return {
		error: {
			code: 'INVALID_QUERY_PARAMETER',
			message: 'One or more query parameters are invalid.',
			details: [...details],
		},
	};
}

function readSingleQueryValues(queries: Readonly<Record<string, readonly string[]>>): { params: Record<string, string>; details: CourseQueryFieldError[] } {
	const params: Record<string, string> = {};
	const details: CourseQueryFieldError[] = [];
	for (const field of Object.keys(queries)) {
		// biome-ignore lint/complexity/useLiteralKeys: index signature key
		const values = queries[field];
		if (values === undefined || values.length === 0) {
			continue;
		}
		if (values.length > 1) {
			details.push({ field, message: `${field} must be provided once.` });
			continue;
		}
		const value = values[0];
		if (value === undefined) {
			continue;
		}
		params[field] = value;
	}
	return { params, details };
}

export function registerCourseRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.get('/api/courses', async (c) => {
		const { params, details } = readSingleQueryValues(c.req.queries());
		const parsed = parseCourseSearchQuery(params);
		const fieldErrors = [...details, ...(parsed.ok ? [] : parsed.details)];
		if (!parsed.ok || fieldErrors.length > 0) {
			return c.json(invalidCourseQuery(fieldErrors), 400);
		}
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const page = await applicationServices.course.search(parsed.query);
		return c.json(page);
	});
}
