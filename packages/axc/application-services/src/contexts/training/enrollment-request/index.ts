import type { EnrollmentRequestEntityReference } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { create, type EnrollmentCreateCommand } from './create.ts';
import { type EnrollmentGetQuery, getById } from './get-by-id.ts';
import { type EnrollmentListQuery, list } from './list.ts';
import { type EnrollmentUpdateStatusCommand, updateStatus } from './update-status.ts';
export interface EnrollmentRequestApplicationService {
	create(command: EnrollmentCreateCommand): Promise<EnrollmentRequestEntityReference>;
	getById(query: EnrollmentGetQuery): Promise<EnrollmentRequestEntityReference>;
	list(query?: EnrollmentListQuery): Promise<{ items: EnrollmentRequestEntityReference[] }>;
	updateStatus(command: EnrollmentUpdateStatusCommand): Promise<EnrollmentRequestEntityReference>;
}
export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => ({
	create: create(dataSources),
	getById: getById(dataSources),
	list: list(dataSources),
	updateStatus: updateStatus(dataSources),
});
export type { EnrollmentCreateCommand } from './create.ts';
export type { EnrollmentUpdateStatusCommand } from './update-status.ts';
