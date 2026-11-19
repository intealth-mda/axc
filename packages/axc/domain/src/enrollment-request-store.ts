import type { EnrollmentRequest } from './enrollment-request.ts';

export interface NewEnrollmentRequest {
	readonly courseId: string;
	readonly learnerEmail: string;
	readonly justification: string;
	readonly createdAt: string;
}

export type AddEnrollmentRequestResult = { readonly added: true; readonly request: EnrollmentRequest } | { readonly added: false; readonly reason: 'duplicate-active' };

/** Process-local port for enrollment requests. Persistence supplies the in-memory implementation. */
export interface EnrollmentRequestStore {
	list(): Promise<readonly EnrollmentRequest[]>;
	findById(id: string): Promise<EnrollmentRequest | undefined>;
	add(input: NewEnrollmentRequest): Promise<AddEnrollmentRequestResult>;
	update(id: string, change: (current: EnrollmentRequest) => EnrollmentRequest): Promise<EnrollmentRequest | undefined>;
}
