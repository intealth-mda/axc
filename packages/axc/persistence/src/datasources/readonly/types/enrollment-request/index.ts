import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../../index.ts';
import { type EnrollmentRequestReadRepository, getEnrollmentRequestReadRepository } from './enrollment-request.read-repository.ts';

export const EnrollmentRequestReadRepositoryImpl = (models: ModelsContext, passport: Passport) => {
	const repository: EnrollmentRequestReadRepository = getEnrollmentRequestReadRepository(models, passport);
	return {
		EnrollmentRequestReadRepo: repository,
	};
};
