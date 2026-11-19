export type { UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';

import type { Passport } from '@axc/domain';
import type { ModelsContext } from '@axc/service-mongoose';
import { DomainDataSourceImplementation } from './datasources/domain/index.ts';
import { type ReadonlyDataSource, ReadonlyDataSourceImplementation } from './datasources/readonly/index.ts';

export type { ModelsContext, ReadonlyDataSource };
export { DomainDataSourceImplementation, ReadonlyDataSourceImplementation };

export interface DataSources {
	domainDataSource: ReturnType<typeof DomainDataSourceImplementation>;
	readonlyDataSource: ReadonlyDataSource;
}

export const createDataSources = (models: ModelsContext, passport: Passport): DataSources => ({
	domainDataSource: DomainDataSourceImplementation(models, passport),
	readonlyDataSource: ReadonlyDataSourceImplementation(models, passport),
});
