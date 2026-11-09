export type ServiceErrorCode = 'INVALID_REQUEST' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';

export interface ErrorDetail {
	readonly field: string;
	readonly message: string;
}

export class ServiceError extends Error {
	readonly code: ServiceErrorCode;
	readonly details: readonly ErrorDetail[];
	constructor(code: ServiceErrorCode, message: string, details: readonly ErrorDetail[] = []) {
		super(message);
		this.name = 'ServiceError';
		this.code = code;
		this.details = details;
	}
}

export const invalid = (details: readonly ErrorDetail[]) => new ServiceError('INVALID_REQUEST', 'The request could not be completed.', details);
