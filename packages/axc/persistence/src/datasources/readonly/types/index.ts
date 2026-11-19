import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../index.ts';
import { CourseReadRepositoryImpl } from './course/index.ts';
import { EnrollmentRequestReadRepositoryImpl } from './enrollment-request/index.ts';

export const TypesContext = (models: ModelsContext, passport: Passport) => ({
	Course: CourseReadRepositoryImpl(models, passport),
	EnrollmentRequest: EnrollmentRequestReadRepositoryImpl(models, passport),
});
