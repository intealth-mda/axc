import type { DataSources } from '../course/data-sources.ts';
import { type EnrollmentRequestItem, toEnrollmentRequestItem } from './item.ts';

export interface EnrollmentRequestQueryCommand {
	status?: string;
	courseId?: string;
	learnerEmail?: string;
}

export interface EnrollmentRequestList {
	items: EnrollmentRequestItem[];
}

export const query = (dataSources: DataSources) => {
	return async (command: EnrollmentRequestQueryCommand): Promise<EnrollmentRequestList> => {
		const email = command.learnerEmail?.toLowerCase();
		const requests = await dataSources.readonlyDataSource.Types.EnrollmentRequest.EnrollmentRequestReadRepo.getAll();
		const items = requests.filter((request) => {
			if (command.status !== undefined && request.status !== command.status) {
				return false;
			}
			if (command.courseId !== undefined && request.courseId !== command.courseId) {
				return false;
			}
			if (email !== undefined && request.learnerEmail.toLowerCase() !== email) {
				return false;
			}
			return true;
		});
		return { items: items.map((request) => toEnrollmentRequestItem(request)) };
	};
};
