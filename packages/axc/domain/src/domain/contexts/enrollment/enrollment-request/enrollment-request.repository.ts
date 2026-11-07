import type { Repository } from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest, EnrollmentRequestProps } from './enrollment-request.aggregate.ts';
export interface EnrollmentRequestRepository extends Repository<EnrollmentRequest> {
	getNewInstance(props: Omit<EnrollmentRequestProps, 'status' | 'statusHistory' | 'updatedAt'>): Promise<EnrollmentRequest>;
}
