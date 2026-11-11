import type * as DomainSeedwork from '@cellix/domain-seedwork/unit-of-work';
import type { CatalogPassport } from '../catalog.passport.ts';
import type { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import type { EnrollmentRequestProps } from './enrollment-request.entity.ts';
import type { EnrollmentRequestRepository } from './enrollment-request.repository.ts';

export interface EnrollmentRequestUnitOfWork
	extends DomainSeedwork.UnitOfWork<CatalogPassport, EnrollmentRequestProps, EnrollmentRequest, EnrollmentRequestRepository>,
		DomainSeedwork.InitializedUnitOfWork<CatalogPassport, EnrollmentRequestProps, EnrollmentRequest, EnrollmentRequestRepository> {}
