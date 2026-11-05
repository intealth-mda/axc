import type { Domain } from '@axc/domain';
import type { ModelsContext } from '../../../../models-context.ts';
import { type EnrollmentRequestReadRepository, getEnrollmentRequestReadRepository } from './enrollment-request.read-repository.ts';

export const EnrollmentRequestReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	const repository: EnrollmentRequestReadRepository = getEnrollmentRequestReadRepository(models, passport);
	return {
		EnrollmentRequestReadRepo: repository,
	};
};
