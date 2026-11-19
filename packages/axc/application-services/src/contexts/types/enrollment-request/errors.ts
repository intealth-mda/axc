export interface EnrollmentRequestFieldDetail {
	field: string;
	message: string;
}

export class EnrollmentRequestFailure extends Error {
	readonly status: 400 | 404 | 409;
	readonly code: string;
	readonly details: readonly EnrollmentRequestFieldDetail[];

	constructor(status: 400 | 404 | 409, code: string, message: string, details: readonly EnrollmentRequestFieldDetail[] = []) {
		super(message);
		this.name = 'EnrollmentRequestFailure';
		this.status = status;
		this.code = code;
		this.details = details;
	}
}
