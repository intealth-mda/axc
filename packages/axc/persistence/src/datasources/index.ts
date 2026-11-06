import { DomainDataSource } from './domain/index.ts';
import { ReadonlyDataSource } from './readonly/index.ts';
import { MemoryStore } from './store.ts';
export interface DataSources {
	readonlyDataSource: ReturnType<typeof ReadonlyDataSource>;
	domainDataSource: ReturnType<typeof DomainDataSource>;
}
export function createDataSources(): DataSources {
	const store = new MemoryStore();
	return { readonlyDataSource: ReadonlyDataSource(store), domainDataSource: DomainDataSource(store) };
}
