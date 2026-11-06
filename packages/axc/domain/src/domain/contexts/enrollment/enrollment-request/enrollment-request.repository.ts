import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest, NewEnrollmentRequest } from './enrollment-request.aggregate.ts';

export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(id: string, input: NewEnrollmentRequest, now: string): Promise<EnrollmentRequest>;
	getById(id: string): Promise<EnrollmentRequest | undefined>;
	getAll(): Promise<EnrollmentRequest[]>;
}
