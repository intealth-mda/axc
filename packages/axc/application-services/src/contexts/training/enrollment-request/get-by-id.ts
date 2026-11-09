import { type EnrollmentRequestEntityReference, requiredText, WorkflowError } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export interface EnrollmentGetQuery {
	id: string;
}
export const getById =
	(dataSources: DataSources) =>
	async (query: EnrollmentGetQuery): Promise<EnrollmentRequestEntityReference> => {
		const id = requiredText(query?.id, 'id');
		const result = await dataSources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id);
		if (!result) throw new WorkflowError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.');
		return result;
	};
