import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
export const getById =
	(dataSources: DataSources) =>
	async (id: string): Promise<Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference> => {
		const request = await dataSources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id);
		if (!request) throw new NotFoundError('Enrollment request not found.');
		return request;
	};
