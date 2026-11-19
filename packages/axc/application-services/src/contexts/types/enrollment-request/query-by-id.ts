import type { DataSources } from '../course/data-sources.ts';
import { type EnrollmentRequestItem, toEnrollmentRequestItem } from './item.ts';

export interface EnrollmentRequestQueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestQueryByIdCommand): Promise<EnrollmentRequestItem | null> => {
		const request = await dataSources.readonlyDataSource.Types.EnrollmentRequest.EnrollmentRequestReadRepo.getById(command.id);
		return request === null ? null : toEnrollmentRequestItem(request);
	};
};
