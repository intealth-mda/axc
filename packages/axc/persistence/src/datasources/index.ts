import type { Domain } from '@axc/domain';
import type { ReadonlyDataSource } from './readonly/index.ts';
export interface DataSources {
	readonlyDataSource: ReadonlyDataSource;
	domainDataSource: { Training: { EnrollmentRequest: { EnrollmentRequestUnitOfWork: Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork<Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestProps> } } };
}
export interface DataSourcesFactory {
	withSystemPassport(): DataSources;
}
