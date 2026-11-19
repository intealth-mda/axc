import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import type { Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(id: string, courseId: string, learnerEmail: LearnerEmail, justification: Justification, now: string): EnrollmentRequest;
	getById(id: string): Promise<EnrollmentRequest | undefined>;
	getAll(): Promise<EnrollmentRequest[]>;
}
