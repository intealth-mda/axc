import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getEnrollmentRequestUnitOfWork } from './enrollment-request.uow.ts';

export const EnrollmentRequestPersistence = (models: ModelsContext, passport: Passport) => {
	const EnrollmentRequestModel = models.EnrollmentRequest;
	return {
		EnrollmentRequestUnitOfWork: getEnrollmentRequestUnitOfWork(EnrollmentRequestModel, passport),
	};
};
