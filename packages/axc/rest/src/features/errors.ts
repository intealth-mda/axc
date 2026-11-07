import { ApplicationError } from '@axc/application-services';
import type { Context } from 'hono';

const status: Record<string, number> = {
	INVALID_QUERY_PARAMETER: 400,
	INVALID_REQUEST: 400,
	COURSE_NOT_FOUND: 404,
	COURSE_NOT_ACTIVE: 409,
	DUPLICATE_ACTIVE_REQUEST: 409,
	ENROLLMENT_REQUEST_NOT_FOUND: 404,
	INVALID_STATUS_TRANSITION: 409,
};
export const respondWithError = (c: Context, error: unknown): Response => {
	if (error instanceof ApplicationError)
		return c.json(
			{ error: { code: error.code, message: error.code === 'INVALID_QUERY_PARAMETER' ? 'One or more query parameters are invalid.' : 'The request could not be completed.', details: error.details } },
			status[error.code] as 400 | 404 | 409,
		);
	return c.json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.', details: [] } }, 500);
};
