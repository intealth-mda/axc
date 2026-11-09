import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest, NewEnrollmentRequest } from './enrollment-request.aggregate.ts';
import type { EnrollmentStatus } from './enrollment-request.value-objects.ts';

export interface EnrollmentRequestFilter {
	readonly status?: EnrollmentStatus | undefined;
	readonly courseId?: string | undefined;
	readonly learnerEmail?: string | undefined;
}

export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): EnrollmentRequest;
	getById(id: string): Promise<EnrollmentRequest | undefined>;
	find(filter: EnrollmentRequestFilter): Promise<EnrollmentRequest[]>;
}
