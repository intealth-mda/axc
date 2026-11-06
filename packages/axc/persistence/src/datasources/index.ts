import type { ReadonlyDataSource } from './readonly/index.ts';
export interface DataSources {
	readonlyDataSource: ReadonlyDataSource;
}
export interface DataSourcesFactory {
	withSystemPassport(): DataSources;
}
