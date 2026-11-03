import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest, NewEnrollmentRequestInput } from './enrollment-request.aggregate.ts';

export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(input: NewEnrollmentRequestInput): EnrollmentRequest;
	getById(id: string): Promise<EnrollmentRequest | undefined>;
	getAll(): Promise<EnrollmentRequest[]>;
}
