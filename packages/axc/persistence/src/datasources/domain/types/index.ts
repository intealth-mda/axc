import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../index.ts';
import * as Course from './course/index.ts';
import * as EnrollmentRequest from './enrollment-request/index.ts';

export const TypesContextPersistence = (models: ModelsContext, passport: Passport) => ({
	Course: Course.CoursePersistence(models, passport),
	EnrollmentRequest: EnrollmentRequest.EnrollmentRequestPersistence(models, passport),
});
