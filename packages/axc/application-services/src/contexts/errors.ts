type ErrorCode = 'INVALID_QUERY_PARAMETER' | 'INVALID_REQUEST' | 'COURSE_NOT_FOUND' | 'COURSE_NOT_ACTIVE' | 'DUPLICATE_ACTIVE_REQUEST' | 'ENROLLMENT_REQUEST_NOT_FOUND' | 'INVALID_STATUS_TRANSITION';
export class ApplicationError extends Error {
	readonly code: ErrorCode;
	readonly details: { field: string; message: string }[];
	constructor(code: ErrorCode, details: { field: string; message: string }[] = []) {
		super(code);
		this.code = code;
		this.details = details;
	}
}
