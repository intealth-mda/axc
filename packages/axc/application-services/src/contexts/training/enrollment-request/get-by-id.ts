import { type EnrollmentRequestEntityReference, RuleError, text } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export interface EnrollmentGetQuery {
	id: string;
}
export const getById =
	(dataSources: DataSources) =>
	async (query: EnrollmentGetQuery): Promise<EnrollmentRequestEntityReference> => {
		const id = text(query?.id, 'id');
		const request = await dataSources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id);
		if (!request) throw new RuleError('ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.');
		return request;
	};
