export interface ErrorDetail {
	field: string;
	message: string;
}

export const applicationErrorStatus = {
	INVALID_QUERY_PARAMETER: 400,
	INVALID_REQUEST: 400,
	COURSE_NOT_FOUND: 404,
	COURSE_NOT_ACTIVE: 409,
	DUPLICATE_ACTIVE_REQUEST: 409,
	ENROLLMENT_REQUEST_NOT_FOUND: 404,
	INVALID_STATUS_TRANSITION: 409,
} as const;

export type ApplicationErrorCode = keyof typeof applicationErrorStatus;

export class ApplicationError extends Error {
	readonly code: ApplicationErrorCode;
	readonly details: readonly ErrorDetail[];

	constructor(code: ApplicationErrorCode, message: string, details: readonly ErrorDetail[] = []) {
		super(message);
		this.name = 'ApplicationError';
		this.code = code;
		this.details = details;
	}
}

export function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
	return values.some((item) => item === value);
}
