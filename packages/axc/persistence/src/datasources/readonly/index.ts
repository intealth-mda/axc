import type { Domain } from '@axc/domain';
import type { ModelsContext } from '../../models-context.ts';
import type { CourseReadRepository } from './catalog/course/course.read-repository.ts';
import type { EnrollmentRequestReadRepository } from './catalog/enrollment-request/enrollment-request.read-repository.ts';
import { CatalogContext } from './catalog/index.ts';

export interface ReadonlyDataSource {
	Catalog: {
		Course: {
			CourseReadRepo: CourseReadRepository;
		};
		EnrollmentRequest: {
			EnrollmentRequestReadRepo: EnrollmentRequestReadRepository;
		};
	};
}

export const ReadonlyDataSourceImplementation = (models: ModelsContext, passport: Domain.Passport): ReadonlyDataSource => ({
	Catalog: CatalogContext(models, passport),
});
