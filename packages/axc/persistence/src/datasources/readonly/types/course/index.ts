import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../../index.ts';
import { type CourseReadRepository, getCourseReadRepository } from './course.read-repository.ts';

export const CourseReadRepositoryImpl = (models: ModelsContext, passport: Passport) => {
	const repository: CourseReadRepository = getCourseReadRepository(models, passport);
	return {
		CourseReadRepo: repository,
	};
};
