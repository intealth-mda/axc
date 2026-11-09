import { type ApplicationServicesFactory, type EnrollmentChangeStatusCommand, type EnrollmentCreateCommand, WorkflowError } from '@axc/application-services';
import type { Context, Hono } from 'hono';

const query = (c: Context, code: string): Record<string, string> => {
	const values = c.req.queries();
	for (const [field, entries] of Object.entries(values)) if (entries.length !== 1) throw new WorkflowError(code, 'Query parameters must occur once.', field);
	return c.req.query();
};
const body = async (c: Context): Promise<Record<string, unknown>> => {
	let value: unknown;
	try {
		value = await c.req.json();
	} catch {
		throw new WorkflowError('INVALID_REQUEST', 'Malformed JSON body.');
	}
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WorkflowError('INVALID_REQUEST', 'Expected a JSON object.');
	return value as Record<string, unknown>;
};
export function registerTrainingRoutes(app: Hono, factory: ApplicationServicesFactory): void {
	app.onError((error, c) => {
		if (!(error instanceof WorkflowError)) return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', details: [] } }, 500);
		const code = error.code;
		const status = code === 'COURSE_NOT_FOUND' || code === 'ENROLLMENT_REQUEST_NOT_FOUND' ? 404 : ['COURSE_NOT_ACTIVE', 'DUPLICATE_ACTIVE_REQUEST', 'INVALID_STATUS_TRANSITION'].includes(code) ? 409 : 400;
		return c.json({ error: { code, message: error.message, details: error.details } }, status);
	});
	const services = async () => (await factory.forRequest()).Training;
	app.get('/api/courses', async (c) => c.json(await (await services()).Course.search(query(c, 'INVALID_QUERY_PARAMETER'))));
	app.post('/api/enrollment-requests', async (c) => c.json(await (await services()).EnrollmentRequest.create((await body(c)) as unknown as EnrollmentCreateCommand), 201));
	app.get('/api/enrollment-requests', async (c) => c.json(await (await services()).EnrollmentRequest.list(query(c, 'INVALID_REQUEST'))));
	app.get('/api/enrollment-requests/:id', async (c) => c.json(await (await services()).EnrollmentRequest.getById({ id: c.req.param('id') })));
	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const input = await body(c);
		return c.json(await (await services()).EnrollmentRequest.changeStatus({ ...input, id: c.req.param('id') } as unknown as EnrollmentChangeStatusCommand));
	});
}
