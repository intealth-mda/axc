import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../index.ts';
import * as Course from './course/index.ts';

export const TypesContextPersistence = (models: ModelsContext, passport: Passport) => ({
	Course: Course.CoursePersistence(models, passport),
});
