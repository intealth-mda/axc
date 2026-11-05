import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface EnrollmentRequestQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestQueryByIdCommand): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference | null> => {
		return await dataSources.readonlyDataSource.Catalog.EnrollmentRequest.EnrollmentRequestReadRepo.getById(command.id);
	};
};
