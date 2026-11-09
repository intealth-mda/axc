import { mongooseContextBuilder } from '@axc/data-sources-mongoose-models';
import { Mongoose } from 'mongoose';
import { ReadonlyDataSourceImplementation } from './readonly/index.ts';
export interface DataSources {
	readonlyDataSource: ReturnType<typeof ReadonlyDataSourceImplementation>;
}
export interface DataSourcesFactory {
	create(): DataSources;
}
export const createFixtureDataSourcesFactory = (): DataSourcesFactory => {
	const models = mongooseContextBuilder(new Mongoose());
	return { create: () => ({ readonlyDataSource: ReadonlyDataSourceImplementation(models) }) };
};
