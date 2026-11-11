import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest } from './enrollment-request.aggregate.ts';

export interface EnrollmentRequestRepository extends DomainSeedwork.Repository<EnrollmentRequest> {
	list(): Promise<readonly EnrollmentRequest[]>;
}
