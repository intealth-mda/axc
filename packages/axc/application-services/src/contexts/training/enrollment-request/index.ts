import type { EnrollmentRequestEntityReference } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { changeStatus, type EnrollmentChangeStatusCommand } from './change-status.ts';
import { create, type EnrollmentCreateCommand } from './create.ts';
import { type EnrollmentGetQuery, getById } from './get-by-id.ts';
import { type EnrollmentListQuery, list } from './list.ts';
export interface EnrollmentRequestApplicationService {
	create: (command: EnrollmentCreateCommand) => Promise<EnrollmentRequestEntityReference>;
	getById: (query: EnrollmentGetQuery) => Promise<EnrollmentRequestEntityReference>;
	list: (query: EnrollmentListQuery) => Promise<EnrollmentRequestEntityReference[]>;
	changeStatus: (command: EnrollmentChangeStatusCommand) => Promise<EnrollmentRequestEntityReference>;
}
export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => ({
	create: create(dataSources),
	getById: getById(dataSources),
	list: list(dataSources),
	changeStatus: changeStatus(dataSources),
});
