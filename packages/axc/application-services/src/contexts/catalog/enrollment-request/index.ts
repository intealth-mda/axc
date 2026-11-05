import type { Domain } from '@axc/domain';
import type { DataSources } from '@axc/persistence';
import { create, type EnrollmentRequestCreateCommand } from './create.ts';
import { type EnrollmentRequestFindCommand, find } from './find.ts';
import { type EnrollmentRequestFindByIdCommand, findById } from './find-by-id.ts';
import { type EnrollmentRequestQueryByIdCommand, queryById } from './query-by-id.ts';
import { type EnrollmentRequestUpdateStatusCommand, updateStatus } from './update-status.ts';

export interface EnrollmentRequestApplicationService {
	queryById: (command: EnrollmentRequestQueryByIdCommand) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference | null>;
	create: (command: EnrollmentRequestCreateCommand) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference>;
	find: (command: EnrollmentRequestFindCommand) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]>;
	findById: (command: EnrollmentRequestFindByIdCommand) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference[]>;
	updateStatus: (command: EnrollmentRequestUpdateStatusCommand) => Promise<Domain.Contexts.Catalog.EnrollmentRequest.EnrollmentRequestEntityReference>;
}

export const EnrollmentRequest = (dataSources: DataSources): EnrollmentRequestApplicationService => {
	return {
		queryById: queryById(dataSources),
		create: create(dataSources),
		find: find(dataSources),
		findById: findById(dataSources),
		updateStatus: updateStatus(dataSources),
	};
};
