import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getCourseUnitOfWork } from './course.uow.ts';

export const CoursePersistence = (models: ModelsContext, passport: Passport) => {
	const CourseModel = models.Course;
	return {
		CourseUnitOfWork: getCourseUnitOfWork(CourseModel, passport),
	};
};
