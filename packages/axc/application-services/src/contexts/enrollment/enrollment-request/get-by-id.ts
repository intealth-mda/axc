import type { Enrollment } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { ApplicationError } from '../../errors.ts';
export const getById =
	(dataSources: DataSources): ((id: string) => Promise<Enrollment.EnrollmentRequestEntityReference>) =>
	async (id: string) => {
		const item = await dataSources.readonlyDataSource.Enrollment.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id);
		if (!item) throw new ApplicationError('ENROLLMENT_REQUEST_NOT_FOUND');
		return item;
	};
