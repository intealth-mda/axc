import { type EnrollmentRequestEntityReference, EnrollmentStatus, LearnerEmail, requiredText, WorkflowError } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
export interface EnrollmentListQuery {
	status?: string;
	courseId?: string;
	learnerEmail?: string;
}
export const list =
	(dataSources: DataSources) =>
	async (query: EnrollmentListQuery): Promise<EnrollmentRequestEntityReference[]> => {
		if (!query || typeof query !== 'object' || Array.isArray(query)) throw new WorkflowError('INVALID_REQUEST', 'Expected query parameters.');
		for (const key of Object.keys(query)) if (!['status', 'courseId', 'learnerEmail'].includes(key)) throw new WorkflowError('INVALID_REQUEST', `Unknown query parameter: ${key}.`, key);
		return await dataSources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.list({
			...(query.status === undefined ? {} : { status: new EnrollmentStatus(query.status).value }),
			...(query.courseId === undefined ? {} : { courseId: requiredText(query.courseId, 'courseId') }),
			...(query.learnerEmail === undefined ? {} : { learnerEmail: new LearnerEmail(query.learnerEmail).value }),
		});
	};
