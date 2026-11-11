import type { DataSources } from '@axc/persistence';
import { type CreateEnrollmentRequestCommand, createEnrollmentRequest } from './create.ts';
import { type EnrollmentRequestItem, type EnrollmentRequestListQuery, getEnrollmentRequest, queryEnrollmentRequests } from './query-enrollment-requests.ts';
import { type UpdateEnrollmentRequestStatusCommand, updateEnrollmentRequestStatus } from './update.ts';

export interface EnrollmentRequestApplicationService {
	create(command: CreateEnrollmentRequestCommand): Promise<EnrollmentRequestItem>;
	getById(id: string): Promise<EnrollmentRequestItem>;
	list(query: EnrollmentRequestListQuery): Promise<EnrollmentRequestItem[]>;
	updateStatus(command: UpdateEnrollmentRequestStatusCommand): Promise<EnrollmentRequestItem>;
}

/** @public Folder-named factory required by application-services-conventions. */
export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => ({
	create: createEnrollmentRequest(dataSources),
	getById: getEnrollmentRequest(dataSources),
	list: queryEnrollmentRequests(dataSources),
	updateStatus: updateEnrollmentRequestStatus(dataSources),
});
