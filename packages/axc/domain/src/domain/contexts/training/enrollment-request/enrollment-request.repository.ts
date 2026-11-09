import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import type { EnrollmentRequestProps } from './enrollment-request.entity.ts';
import type { CreateEnrollmentInput } from './enrollment-request.value-objects.ts';
export interface EnrollmentRequestRepository<P extends EnrollmentRequestProps> extends DomainSeedwork.Repository<EnrollmentRequest<P>> {
	getNewInstance(input: CreateEnrollmentInput): Promise<EnrollmentRequest<P>>;
	hasActive(courseId: string, learnerEmail: string): Promise<boolean>;
}
