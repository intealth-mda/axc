import { type EnrollmentRequestEntityReference, LearnerEmail, RequestStatus } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { object, optionalText } from '../../../validation.ts';
export interface EnrollmentListQuery {
	status?: string;
	courseId?: string;
	learnerEmail?: string;
}
export const list =
	(dataSources: DataSources) =>
	async (query: EnrollmentListQuery = {}): Promise<{ items: EnrollmentRequestEntityReference[] }> => {
		const input = object(query, ['status', 'courseId', 'learnerEmail']);
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const status = input['status'] === undefined ? undefined : new RequestStatus(input['status']).value;
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const courseId = optionalText(input['courseId'], 'courseId');
		// biome-ignore lint/complexity/useLiteralKeys: Runtime input uses an index signature.
		const email = input['learnerEmail'] === undefined ? undefined : new LearnerEmail(input['learnerEmail']).value;
		const records = await dataSources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.list();
		return { items: records.filter((record) => (!status || record.status === status) && (!courseId || record.courseId === courseId) && (!email || record.learnerEmail === email)) };
	};
