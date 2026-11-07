import type { Enrollment } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { ApplicationError } from '../../errors.ts';
export interface EnrollmentRequestFilters {
	status?: string | undefined;
	courseId?: string | undefined;
	learnerEmail?: string | undefined;
}
export const list =
	(dataSources: DataSources): ((filters: EnrollmentRequestFilters) => Promise<Enrollment.EnrollmentRequestEntityReference[]>) =>
	async (filters: EnrollmentRequestFilters) => {
		if (filters.status && !['pending', 'approved', 'rejected', 'cancelled'].includes(filters.status)) throw new ApplicationError('INVALID_REQUEST', [{ field: 'status', message: 'Invalid status.' }]);
		return await dataSources.readonlyDataSource.Enrollment.EnrollmentRequest.EnrollmentRequestReadRepo.list({ ...filters, ...(filters.learnerEmail ? { learnerEmail: filters.learnerEmail.toLowerCase() } : {}) });
	};
