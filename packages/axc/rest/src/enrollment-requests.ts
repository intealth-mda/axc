import type { ApplicationServices, CreateEnrollmentRequestCommand, EnrollmentRequestFailure, EnrollmentRequestQueryCommand, UpdateEnrollmentRequestStatusCommand } from '@axc/application-services';
import { enrollmentRequestStatuses } from '@axc/domain';
import type { Context, Hono } from 'hono';

const listParameters = ['status', 'courseId', 'learnerEmail'] as const;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalidRequestMessage = 'The request could not be completed.';

export interface EnrollmentRequestFieldDetail {
	field: string;
	message: string;
}

export interface EnrollmentRequestErrorResponse {
	error: {
		code: string;
		message: string;
		details: EnrollmentRequestFieldDetail[];
	};
}

type ParsedCreate = { ok: true; command: CreateEnrollmentRequestCommand } | { ok: false; response: EnrollmentRequestErrorResponse };
type ParsedUpdate = { ok: true; command: Omit<UpdateEnrollmentRequestStatusCommand, 'id'> } | { ok: false; response: EnrollmentRequestErrorResponse };
type ParsedQuery = { ok: true; command: EnrollmentRequestQueryCommand } | { ok: false; response: EnrollmentRequestErrorResponse };

function errorResponse(code: string, message: string, details: EnrollmentRequestFieldDetail[]): EnrollmentRequestErrorResponse {
	return { error: { code, message, details } };
}

function invalid(details: EnrollmentRequestFieldDetail[]): EnrollmentRequestErrorResponse {
	return errorResponse('INVALID_REQUEST', invalidRequestMessage, details);
}

function textValue(value: unknown): string | undefined {
	return typeof value === 'string' ? value.trim() : undefined;
}

function parseCreateBody(body: unknown): ParsedCreate {
	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		return { ok: false, response: invalid([{ field: 'body', message: 'Request body must be a JSON object.' }]) };
	}
	const record = body as Record<string, unknown>;
	const details: EnrollmentRequestFieldDetail[] = [];

	const courseId = textValue(record['courseId']);
	if (courseId === undefined || courseId.length === 0) {
		details.push({ field: 'courseId', message: 'courseId is required.' });
	}

	const learnerEmail = textValue(record['learnerEmail']);
	if (learnerEmail === undefined || learnerEmail.length === 0) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	} else if (learnerEmail.length > 319) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be at most 319 characters.' });
	} else if (!emailPattern.test(learnerEmail)) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	}

	const justification = textValue(record['justification']);
	if (justification === undefined || justification.length < 20 || justification.length > 500) {
		details.push({ field: 'justification', message: 'justification must be between 20 and 500 characters.' });
	}

	if (details.length > 0 || courseId === undefined || learnerEmail === undefined || justification === undefined) {
		return { ok: false, response: invalid(details) };
	}
	return { ok: true, command: { courseId, learnerEmail, justification } };
}

function parseReason(value: unknown, details: EnrollmentRequestFieldDetail[]): string | null {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== 'string') {
		details.push({ field: 'reason', message: 'reason must be a string.' });
		return null;
	}
	const reason = value.trim();
	if (reason.length === 0) {
		return null;
	}
	if (reason.length > 500) {
		details.push({ field: 'reason', message: 'reason must be at most 500 characters.' });
		return null;
	}
	return reason;
}

function parseUpdateBody(body: unknown): ParsedUpdate {
	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		return { ok: false, response: invalid([{ field: 'body', message: 'Request body must be a JSON object.' }]) };
	}
	const record = body as Record<string, unknown>;
	const details: EnrollmentRequestFieldDetail[] = [];
	const status = textValue(record['status']);
	if (status === undefined || !(enrollmentRequestStatuses as readonly string[]).includes(status)) {
		details.push({ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' });
	}
	const changedBy = textValue(record['changedBy']);
	if (changedBy === undefined || changedBy.length === 0) {
		details.push({ field: 'changedBy', message: 'changedBy is required.' });
	}
	const reason = parseReason(record['reason'], details);
	if (details.length > 0 || status === undefined || changedBy === undefined) {
		return { ok: false, response: invalid(details) };
	}
	return { ok: true, command: { status, changedBy, reason } };
}

function singleValue(values: string[] | undefined, field: string, details: EnrollmentRequestFieldDetail[]): string | undefined {
	if (values === undefined) {
		return undefined;
	}
	if (values.length !== 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	const value = values[0];
	if (value === undefined) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	return value.trim();
}

function parseListQuery(queries: Record<string, string[]>): ParsedQuery {
	const details: EnrollmentRequestFieldDetail[] = [];
	for (const field of Object.keys(queries).sort()) {
		if (!(listParameters as readonly string[]).includes(field)) {
			details.push({ field, message: `${field} is not a supported query parameter.` });
		}
	}
	const status = singleValue(queries['status'], 'status', details);
	const courseId = singleValue(queries['courseId'], 'courseId', details);
	const learnerEmail = singleValue(queries['learnerEmail'], 'learnerEmail', details);
	if (status !== undefined && !(enrollmentRequestStatuses as readonly string[]).includes(status)) {
		details.push({ field: 'status', message: 'status must be one of pending, approved, rejected, cancelled.' });
	}
	if (courseId !== undefined && courseId.length === 0) {
		details.push({ field: 'courseId', message: 'courseId must be a non-empty string.' });
	}
	if (learnerEmail !== undefined && !emailPattern.test(learnerEmail)) {
		details.push({ field: 'learnerEmail', message: 'learnerEmail must be a valid email address.' });
	}
	if (details.length > 0) {
		return { ok: false, response: invalid(details) };
	}
	const command: EnrollmentRequestQueryCommand = {};
	if (status !== undefined) {
		command.status = status;
	}
	if (courseId !== undefined) {
		command.courseId = courseId;
	}
	if (learnerEmail !== undefined) {
		command.learnerEmail = learnerEmail;
	}
	return { ok: true, command };
}

async function readJson(c: Context): Promise<{ ok: true; value: unknown } | { ok: false; response: EnrollmentRequestErrorResponse }> {
	try {
		return { ok: true, value: await c.req.json() };
	} catch {
		return { ok: false, response: invalid([{ field: 'body', message: 'Request body must be JSON.' }]) };
	}
}

function failureResponse(c: Context, error: unknown): Response {
	if (error instanceof Error && 'status' in error && 'code' in error && 'details' in error) {
		const failure = error as EnrollmentRequestFailure;
		return c.json(errorResponse(failure.code, failure.message, [...failure.details]), failure.status);
	}
	return c.json(invalid([]), 400);
}

function servicesFor(c: Context, resolve: (authorization?: string) => Promise<ApplicationServices>): Promise<ApplicationServices> {
	const authorization = c.req.header('Authorization');
	return authorization === undefined ? resolve() : resolve(authorization);
}

export function registerEnrollmentRequestRoutes(app: Hono, resolve: (authorization?: string) => Promise<ApplicationServices>): void {
	app.post('/api/enrollment-requests', async (c) => {
		const body = await readJson(c);
		if (!body.ok) {
			return c.json(body.response, 400);
		}
		const parsed = parseCreateBody(body.value);
		if (!parsed.ok) {
			return c.json(parsed.response, 400);
		}
		try {
			const applicationServices = await servicesFor(c, resolve);
			return c.json(await applicationServices.types.EnrollmentRequest.create(parsed.command), 201);
		} catch (error) {
			return failureResponse(c, error);
		}
	});

	app.get('/api/enrollment-requests', async (c) => {
		const parsed = parseListQuery(c.req.queries());
		if (!parsed.ok) {
			return c.json(parsed.response, 400);
		}
		try {
			const applicationServices = await servicesFor(c, resolve);
			return c.json(await applicationServices.types.EnrollmentRequest.query(parsed.command));
		} catch (error) {
			return failureResponse(c, error);
		}
	});

	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const body = await readJson(c);
		if (!body.ok) {
			return c.json(body.response, 400);
		}
		const parsed = parseUpdateBody(body.value);
		if (!parsed.ok) {
			return c.json(parsed.response, 400);
		}
		const id = c.req.param('id');
		try {
			const applicationServices = await servicesFor(c, resolve);
			return c.json(await applicationServices.types.EnrollmentRequest.updateStatus({ id, ...parsed.command }));
		} catch (error) {
			return failureResponse(c, error);
		}
	});

	app.get('/api/enrollment-requests/:id', async (c) => {
		const id = c.req.param('id');
		try {
			const applicationServices = await servicesFor(c, resolve);
			const request = await applicationServices.types.EnrollmentRequest.queryById({ id });
			if (!request) {
				return c.json(errorResponse('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.', [{ field: 'id', message: 'Enrollment request not found.' }]), 404);
			}
			return c.json(request);
		} catch (error) {
			return failureResponse(c, error);
		}
	});
}
