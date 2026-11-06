import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { create } from './create.ts';
import { getById } from './get-by-id.ts';
import { queryRequests } from './query-requests.ts';
import { update } from './update.ts';

type Enrollment = Domain.Contexts.Training.EnrollmentRequest.EnrollmentRequestEntityReference;
export interface EnrollmentRequestApplicationService {
	create(input: Domain.Contexts.Training.EnrollmentRequest.CreateEnrollmentInput): Promise<Enrollment>;
	update(id: string, input: Domain.Contexts.Training.EnrollmentRequest.UpdateEnrollmentInput): Promise<Enrollment>;
	getById(id: string): Promise<Enrollment>;
	queryRequests(filter: Domain.Contexts.Training.EnrollmentRequest.EnrollmentFilter): Promise<Enrollment[]>;
}
export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => ({
	create: create(dataSources),
	update: update(dataSources),
	getById: getById(dataSources),
	queryRequests: queryRequests(dataSources),
});
