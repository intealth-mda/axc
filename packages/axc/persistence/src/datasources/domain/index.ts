import type { Passport } from '@axc/domain';
import type { ModelsContext } from '../../index.ts';
import { TypesContextPersistence } from './types/index.ts';

export const DomainDataSourceImplementation = (models: ModelsContext, passport: Passport) => ({
	Types: TypesContextPersistence(models, passport),
});
