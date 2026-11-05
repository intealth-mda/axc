import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest, EnrollmentRequestProps } from './enrollment-request.aggregate.ts';

export interface EnrollmentRequestRepository<props extends EnrollmentRequestProps> extends Repository<EnrollmentRequest<props>> {
	getNewInstance(courseId: string, learnerEmail: string, justification: string, status: 'pending' | 'approved' | 'rejected' | 'cancelled'): Promise<EnrollmentRequest<props>>;
	getById(id: string): Promise<EnrollmentRequest<props>>;
}
