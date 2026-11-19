import type { Repository } from '@cellix/domain-seedwork/repository';
import * as Contexts from './domain/contexts/index.ts';
import { type Passport, PassportFactory } from './domain/contexts/passport.ts';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { Passport } from './domain/contexts/passport.ts';
export { PassportFactory } from './domain/contexts/passport.ts';
export { courseModalities, courseStatuses } from './domain/contexts/types/course/course.value-objects.ts';
export { Course, type CourseEntityReference, type CourseProps, type CourseRepository, type CourseUnitOfWork, catalogCourses } from './domain/contexts/types/course/index.ts';

export const Domain = {
	Contexts,
	Passport: PassportFactory,
};

export type Domain = {
	Contexts: typeof Contexts;
	Passport: Passport;
};

export interface DomainDataSource {
	Types: {
		Course: {
			CourseUnitOfWork: Contexts.Types.Course.CourseUnitOfWork;
		};
	};
}
