import type { Domain } from '@axc/domain';
import { enrollmentRequestUnitOfWork } from './datasources/domain/training/enrollment-request/enrollment-request.uow.ts';
import type { DataSourcesFactory } from './datasources/index.ts';
import { courseReadRepository } from './datasources/readonly/training/course/course.read-repository.ts';
import { enrollmentRequestReadRepository } from './datasources/readonly/training/enrollment-request/enrollment-request.read-repository.ts';
import { courses } from './seed/training/course.ts';

export type { DataSources, DataSourcesFactory } from './datasources/index.ts';
export const Persistence = (): DataSourcesFactory => {
	const store = new Map<string, Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps>();
	const dataSources = {
		readonlyDataSource: { Training: { Course: { CourseReadRepo: courseReadRepository(courses) }, EnrollmentRequest: { EnrollmentRequestReadRepo: enrollmentRequestReadRepository(store) } } },
		domainDataSource: { Training: { EnrollmentRequest: { EnrollmentRequestUnitOfWork: enrollmentRequestUnitOfWork(store) } } },
	};
	return { withSystemPassport: () => dataSources };
};

export type { CoursePage } from './datasources/readonly/training/course/course.read-repository.ts';
