import type { Domain } from '@axc/domain';
import type { ModelsContext } from '../../../models-context.ts';
import * as Course from './course/index.ts';
import * as EnrollmentRequest from './enrollment-request/index.ts';

export const CatalogContextPersistence = (models: ModelsContext, passport: Domain.Passport) => ({
	Course: Course.CoursePersistence(models, passport),
	EnrollmentRequest: EnrollmentRequest.EnrollmentRequestPersistence(models, passport),
});
