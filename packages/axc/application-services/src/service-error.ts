export type ServiceErrorCode = 'INVALID_QUERY_PARAMETER';

export interface ServiceErrorDetail {
	field: string;
	message: string;
}

export class ServiceError extends Error {
	readonly code: ServiceErrorCode;
	readonly details: ServiceErrorDetail[];
	constructor(code: ServiceErrorCode, message: string, details: ServiceErrorDetail[]) {
		super(message);
		this.code = code;
		this.details = details;
	}
}
