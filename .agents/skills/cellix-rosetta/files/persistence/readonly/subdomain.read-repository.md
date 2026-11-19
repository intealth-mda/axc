# `<subdomain>.read-repository.ts`

Path: `<persistence>/datasources/readonly/<context>/<subdomain>/<subdomain>.read-repository.ts`

`getAll` and `getById` are not required. When either is written, it goes through the data source and `converter.toDomain`. `getById` returns `null` when the document is missing. A read the user named is added beside them and rejects until the query is written.

```ts
import type { <Subdomain>ModelType } from '<scope>/data-sources-mongoose-models';
import type { Domain } from '<scope>/domain';
import { <Subdomain>Converter } from '../../../domain/<context>/<subdomain>/<subdomain>.domain-adapter.ts';
import type { FindOneOptions, FindOptions } from '../../mongo-data-source.ts';
import { <Subdomain>DataSourceImpl, type <Subdomain>DataSource } from './<subdomain>.data.ts';

export interface <Subdomain>ReadRepository {
	getAll: (options?: FindOptions) => Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference[]>;
	getById: (id: string, options?: FindOneOptions) => Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference | null>;
}

class <Subdomain>ReadRepositoryImpl implements <Subdomain>ReadRepository {
	private readonly mongoDataSource: <Subdomain>DataSource;
	private readonly converter: <Subdomain>Converter;
	private readonly passport: Domain.Passport;

	constructor(models: { <Subdomain>: <Subdomain>ModelType }, passport: Domain.Passport) {
		this.mongoDataSource = new <Subdomain>DataSourceImpl(models.<Subdomain>);
		this.converter = new <Subdomain>Converter();
		this.passport = passport;
	}

	async getAll(options?: FindOptions): Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference[]> {
		const result = await this.mongoDataSource.find({}, options);
		return result.map((doc) => this.converter.toDomain(doc, this.passport));
	}

	async getById(id: string, options?: FindOneOptions): Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference | null> {
		const result = await this.mongoDataSource.findById(id, options);
		if (!result) {
			return null;
		}
		return this.converter.toDomain(result, this.passport);
	}
}

export const get<Subdomain>ReadRepository = (models: { <Subdomain>: <Subdomain>ModelType }, passport: Domain.Passport): <Subdomain>ReadRepository => {
	return new <Subdomain>ReadRepositoryImpl(models, passport);
};
```

The indexes are [subdomain.index.md](subdomain.index.md), [context.index.md](context.index.md), and [index.md](index.md).
