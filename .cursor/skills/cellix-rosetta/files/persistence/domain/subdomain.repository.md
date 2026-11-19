# Persistence `<subdomain>.repository.ts`

Path: `<persistence>/datasources/domain/<context>/<subdomain>/<subdomain>.repository.ts`

`getById` loads `this.model.findById(id)` and throws `` `<Subdomain> with id ${id} not found` `` when the document is missing. `getNewInstance` adapts `new this.model()` and forwards the same root scalars and aggregate references the aggregate takes.

```ts
import type { <Subdomain> } from '<scope>/data-sources-mongoose-models';
import { Domain } from '<scope>/domain';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { <Subdomain>DomainAdapter } from './<subdomain>.domain-adapter.ts';

export class <Subdomain>Repository
	extends MongooseSeedwork.MongoRepositoryBase<<Subdomain>, <Subdomain>DomainAdapter, Domain.Passport, Domain.Contexts.<Context>.<Subdomain>.<Subdomain><<Subdomain>DomainAdapter>>
	implements Domain.Contexts.<Context>.<Subdomain>.<Subdomain>Repository<<Subdomain>DomainAdapter>
{
	async getById(id: string): Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain><<Subdomain>DomainAdapter>> {
		const document = await this.model.findById(id).exec();
		if (!document) {
			throw new Error(`<Subdomain> with id ${id} not found`);
		}
		return this.typeConverter.toDomain(document, this.passport);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(<field>: string): Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain><<Subdomain>DomainAdapter>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.<Context>.<Subdomain>.<Subdomain>.getNewInstance(adapter, <field>, this.passport));
	}
}
```
