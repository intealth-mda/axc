import type { DataSources } from '@axc/persistence';
import { type ChangeStatusCommand, changeStatus } from './change-status.ts';
import { type CreateEnrollmentRequestCommand, create } from './create.ts';
import { getById } from './get-by-id.ts';
import { type EnrollmentRequestFilters, list } from './list.ts';

export type { ChangeStatusCommand, CreateEnrollmentRequestCommand, EnrollmentRequestFilters };
export interface EnrollmentRequestApplicationService {
	create(command: CreateEnrollmentRequestCommand): ReturnType<ReturnType<typeof create>>;
	getById(id: string): ReturnType<ReturnType<typeof getById>>;
	list(filters: EnrollmentRequestFilters): ReturnType<ReturnType<typeof list>>;
	changeStatus(id: string, command: ChangeStatusCommand): ReturnType<ReturnType<typeof changeStatus>>;
}
export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => ({
	create: create(dataSources),
	getById: getById(dataSources),
	list: list(dataSources),
	changeStatus: changeStatus(dataSources),
});
