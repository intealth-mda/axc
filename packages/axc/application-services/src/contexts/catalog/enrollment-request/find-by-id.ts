import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface EnrollmentRequestFindByIdCommand {
	id?: string;
}

export const findById = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestFindByIdCommand): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]> => {
		if (command.id === undefined || command.id === '') {
			throw Object.assign(new Error('Enrollment request does not exist.'), { status: 404, code: 'ENROLLMENT_REQUEST_NOT_FOUND', field: 'id' });
		}
		return await dataSources.readonlyDataSource.Catalog.EnrollmentRequest.EnrollmentRequestReadRepo.findById(command.id);
	};
};
