import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';

export interface EnrollmentRequestFindCommand {
	status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
	courseId?: string;
	learnerEmail?: string;
}

export const find = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestFindCommand): Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]> => {
		return await dataSources.readonlyDataSource.Catalog.EnrollmentRequest.EnrollmentRequestReadRepo.find(command.status, command.courseId, command.learnerEmail);
	};
};
