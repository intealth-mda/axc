import type { Domain } from '@axc/domain';
import type { ModelsContext } from '../../../../models-context.ts';
import { getEnrollmentRequestUnitOfWork } from './enrollment-request.uow.ts';

export const EnrollmentRequestPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const EnrollmentRequestModel = models.EnrollmentRequest;
	return {
		EnrollmentRequestUnitOfWork: getEnrollmentRequestUnitOfWork(EnrollmentRequestModel, passport),
	};
};
