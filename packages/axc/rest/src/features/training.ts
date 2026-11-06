import { ApplicationError, type ApplicationServicesFactory, type CourseSearchQuery, type EnrollmentCreateCommand } from '@axc/application-services';
import type { Context, Hono } from 'hono';

function query(c: Context, code: string): Record<string, string> {
	const params = new URL(c.req.url).searchParams;
	const result: Record<string, string> = {};
	for (const [key, value] of params) {
		if (key in result) throw new ApplicationError(code, 'Repeated query parameter.', [{ field: key, message: 'Parameters must appear once.' }]);
		result[key] = value;
	}
	return result;
}
async function body(c: Context): Promise<Record<string, unknown>> {
	let value: unknown;
	try {
		value = await c.req.json();
	} catch {
		throw new ApplicationError('INVALID_REQUEST', 'Invalid JSON body.', [{ field: 'body', message: 'A JSON object is required.' }]);
	}
	if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new ApplicationError('INVALID_REQUEST', 'A JSON object is required.');
	return value as Record<string, unknown>;
}
const statuses = { INVALID_QUERY_PARAMETER: 400, INVALID_REQUEST: 400, COURSE_NOT_FOUND: 404, COURSE_NOT_ACTIVE: 409, DUPLICATE_ACTIVE_REQUEST: 409, ENROLLMENT_REQUEST_NOT_FOUND: 404, INVALID_STATUS_TRANSITION: 409 } as const;
export function registerTrainingRoutes(app: Hono, factory: ApplicationServicesFactory): void {
	const services = async (c: Context) => (await factory.forRequest(c.req.header('Authorization'))).Training;
	app.onError((error, c) => {
		if (error instanceof ApplicationError) {
			const status = statuses[error.code as keyof typeof statuses] ?? 500;
			return c.json({ error: { code: error.code, message: error.message, details: error.details } }, status);
		}
		return c.json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.', details: [] } }, 500);
	});
	app.get('/api/courses', async (c) => c.json(await (await services(c)).Course.search(query(c, 'INVALID_QUERY_PARAMETER') as CourseSearchQuery)));
	app.post('/api/enrollment-requests', async (c) => {
		const input = await body(c);
		const result = await (await services(c)).EnrollmentRequest.create(input as unknown as EnrollmentCreateCommand);
		c.header('Location', `/api/enrollment-requests/${result.id}`);
		return c.json(result, 201);
	});
	app.get('/api/enrollment-requests', async (c) => c.json(await (await services(c)).EnrollmentRequest.list(query(c, 'INVALID_REQUEST'))));
	app.get('/api/enrollment-requests/:id', async (c) => c.json(await (await services(c)).EnrollmentRequest.getById({ id: c.req.param('id') })));
	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const input = await body(c);
		if ('id' in input) throw new ApplicationError('INVALID_REQUEST', 'id must come from the URL.', [{ field: 'id', message: 'id must come from the URL.' }]);
		return c.json(await (await services(c)).EnrollmentRequest.updateStatus({ ...input, id: c.req.param('id') } as { id: string; status: string; changedBy: string; reason?: string }));
	});
}
