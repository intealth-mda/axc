import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../index.ts';
import type { CourseReadRepository } from './types/course/course.read-repository.ts';
import type { EnrollmentRequestReadRepository } from './types/enrollment-request/enrollment-request.read-repository.ts';
import { TypesContext } from './types/index.ts';

export interface ReadonlyDataSource {
	Types: {
		Course: {
			CourseReadRepo: CourseReadRepository;
		};
		EnrollmentRequest: {
			EnrollmentRequestReadRepo: EnrollmentRequestReadRepository;
		};
	};
}

export const ReadonlyDataSourceImplementation = (models: ModelsContext, passport: Passport): ReadonlyDataSource => ({
	Types: TypesContext(models, passport),
});
