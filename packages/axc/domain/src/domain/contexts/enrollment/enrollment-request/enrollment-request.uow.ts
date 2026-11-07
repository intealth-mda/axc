import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { EnrollmentRequest, EnrollmentRequestProps } from './enrollment-request.aggregate.ts';
import type { EnrollmentRequestRepository } from './enrollment-request.repository.ts';
export interface EnrollmentRequestUnitOfWork extends UnitOfWork<undefined, EnrollmentRequestProps, EnrollmentRequest, EnrollmentRequestRepository> {}
export interface InitializedEnrollmentRequestUnitOfWork extends InitializedUnitOfWork<undefined, EnrollmentRequestProps, EnrollmentRequest, EnrollmentRequestRepository> {}
