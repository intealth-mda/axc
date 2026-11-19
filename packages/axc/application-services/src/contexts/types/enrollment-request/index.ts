import type { DataSources } from '../course/data-sources.ts';
import { type CreateEnrollmentRequestCommand, create } from './create.ts';
import type { EnrollmentRequestItem } from './item.ts';
import { type EnrollmentRequestList, type EnrollmentRequestQueryCommand, query } from './query.ts';
import { type EnrollmentRequestQueryByIdCommand, queryById } from './query-by-id.ts';
import { type UpdateEnrollmentRequestStatusCommand, updateStatus } from './update-status.ts';

export interface EnrollmentRequestApplicationService {
	queryById: (command: EnrollmentRequestQueryByIdCommand) => Promise<EnrollmentRequestItem | null>;
	query: (command: EnrollmentRequestQueryCommand) => Promise<EnrollmentRequestList>;
	create: (command: CreateEnrollmentRequestCommand) => Promise<EnrollmentRequestItem>;
	updateStatus: (command: UpdateEnrollmentRequestStatusCommand) => Promise<EnrollmentRequestItem>;
}

export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => ({
	queryById: queryById(dataSources),
	query: query(dataSources),
	create: create(dataSources),
	updateStatus: updateStatus(dataSources),
});
