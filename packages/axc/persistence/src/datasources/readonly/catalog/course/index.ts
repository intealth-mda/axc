import type { Domain } from '@axc/domain';
import type { ModelsContext } from '../../../../models-context.ts';
import { type CourseReadRepository, getCourseReadRepository } from './course.read-repository.ts';

export const CourseReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	const repository: CourseReadRepository = getCourseReadRepository(models, passport);
	return {
		CourseReadRepo: repository,
	};
};
