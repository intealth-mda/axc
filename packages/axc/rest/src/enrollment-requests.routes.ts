import { type ApplicationServicesFactory, type EnrollmentFieldError, EnrollmentRequestError, parseEnrollmentRequestListQuery } from '@axc/application-services';
import type { Hono } from 'hono';

interface EnrollmentErrorBody {
	error: {
		code: EnrollmentRequestError['code'] | 'INVALID_REQUEST';
		message: 'The request could not be completed.';
		details: EnrollmentFieldError[];
	};
}

function enrollmentError(code: EnrollmentErrorBody['error']['code'], details: readonly EnrollmentFieldError[]): EnrollmentErrorBody {
	return {
		error: {
			code,
			message: 'The request could not be completed.',
			details: [...details],
		},
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
	// biome-ignore lint/complexity/useLiteralKeys: index signature key
	const value = record[key];
	return typeof value === 'string' ? value : undefined;
}

function readSingleQueryValues(queries: Readonly<Record<string, readonly string[]>>): { params: Record<string, string>; details: EnrollmentFieldError[] } {
	const params: Record<string, string> = {};
	const details: EnrollmentFieldError[] = [];
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

async function servicesFor(c: { req: { header: (name: string) => string | undefined } }, applicationServicesFactory: ApplicationServicesFactory) {
	const authorization = c.req.header('Authorization');
	return authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
}

export function registerEnrollmentRequestRoutes(app: Hono, applicationServicesFactory: ApplicationServicesFactory): void {
	app.post('/api/enrollment-requests', async (c) => {
		const body: unknown = await c.req.json().catch(() => undefined);
		if (!isRecord(body)) {
			return c.json(enrollmentError('INVALID_REQUEST', [{ field: 'body', message: 'Request body must be a JSON object.' }]), 400);
		}
		const courseId = readString(body, 'courseId');
		const learnerEmail = readString(body, 'learnerEmail');
		const justification = readString(body, 'justification');
		const details: EnrollmentFieldError[] = [];
		if (courseId === undefined) {
			details.push({ field: 'courseId', message: 'courseId is required.' });
		}
		if (learnerEmail === undefined) {
			details.push({ field: 'learnerEmail', message: 'learnerEmail is required.' });
		}
		if (justification === undefined) {
			details.push({ field: 'justification', message: 'justification is required.' });
		}
		if (details.length > 0 || courseId === undefined || learnerEmail === undefined || justification === undefined) {
			return c.json(enrollmentError('INVALID_REQUEST', details), 400);
		}

		try {
			const applicationServices = await servicesFor(c, applicationServicesFactory);
			const created = await applicationServices.enrollmentRequest.create({ courseId, learnerEmail, justification });
			return c.json(created, 201);
		} catch (error) {
			if (error instanceof EnrollmentRequestError) {
				return c.json(enrollmentError(error.code, error.details), error.statusCode);
			}
			throw error;
		}
	});

	app.get('/api/enrollment-requests', async (c) => {
		const { params, details } = readSingleQueryValues(c.req.queries());
		const parsed = parseEnrollmentRequestListQuery(params);
		const fieldErrors = [...details, ...(parsed.ok ? [] : parsed.details)];
		if (!parsed.ok || fieldErrors.length > 0) {
			return c.json(enrollmentError('INVALID_REQUEST', fieldErrors), 400);
		}
		const applicationServices = await servicesFor(c, applicationServicesFactory);
		const items = await applicationServices.enrollmentRequest.list(parsed.query);
		return c.json(items);
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		try {
			const applicationServices = await servicesFor(c, applicationServicesFactory);
			const item = await applicationServices.enrollmentRequest.getById(c.req.param('id'));
			return c.json(item);
		} catch (error) {
			if (error instanceof EnrollmentRequestError) {
				return c.json(enrollmentError(error.code, error.details), error.statusCode);
			}
			throw error;
		}
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const body: unknown = await c.req.json().catch(() => undefined);
		if (!isRecord(body)) {
			return c.json(enrollmentError('INVALID_REQUEST', [{ field: 'body', message: 'Request body must be a JSON object.' }]), 400);
		}
		const status = readString(body, 'status');
		const changedBy = readString(body, 'changedBy');
		const reason = readString(body, 'reason');
		const details: EnrollmentFieldError[] = [];
		if (status === undefined) {
			details.push({ field: 'status', message: 'status is required.' });
		}
		if (changedBy === undefined) {
			details.push({ field: 'changedBy', message: 'changedBy is required.' });
		}
		if (details.length > 0 || status === undefined || changedBy === undefined) {
			return c.json(enrollmentError('INVALID_REQUEST', details), 400);
		}

		try {
			const applicationServices = await servicesFor(c, applicationServicesFactory);
			const updated = await applicationServices.enrollmentRequest.updateStatus({
				id: c.req.param('id'),
				status,
				changedBy,
				...(reason !== undefined ? { reason } : {}),
			});
			return c.json(updated);
		} catch (error) {
			if (error instanceof EnrollmentRequestError) {
				return c.json(enrollmentError(error.code, error.details), error.statusCode);
			}
			throw error;
		}
	});
}
