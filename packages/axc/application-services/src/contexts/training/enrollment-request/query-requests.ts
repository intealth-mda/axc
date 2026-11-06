import { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export const queryRequests = (dataSources: DataSources) => async (filter: Domain.Contexts.Training.EnrollmentRequest.EnrollmentFilter) => {
	Domain.Contexts.Training.EnrollmentRequest.assertEnrollmentFilter(filter);
	return await dataSources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.list(filter);
};
