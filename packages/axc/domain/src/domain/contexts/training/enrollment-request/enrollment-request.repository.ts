import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest } from './enrollment-request.aggregate.ts';
export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(courseId: string, learnerEmail: string, justification: string): Promise<EnrollmentRequest>;
	getById(id: string): Promise<EnrollmentRequest>;
}
