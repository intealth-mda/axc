export type ServiceErrorCode = 'INVALID_REQUEST' | 'INVALID_QUERY_PARAMETER' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';

export interface ErrorDetail {
	field: string;
	message: string;
}

export class ServiceError extends Error {
	readonly code: ServiceErrorCode;
	readonly details: ErrorDetail[];
	constructor(code: ServiceErrorCode, message: string, details: ErrorDetail[] = []) {
		super(message);
		this.name = 'ServiceError';
		this.code = code;
		this.details = details;
	}
}
