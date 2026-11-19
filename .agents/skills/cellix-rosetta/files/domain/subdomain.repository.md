# `<subdomain>.repository.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<subdomain>.repository.ts`

The parameter list matches `getNewInstance` on the aggregate, without `newProps` and without `passport`. An existing aggregate reference may be a parameter. A nested value object or a collection is not. When the interface already exists, add `getNewInstance` and `getById` if they are missing. A named query may add another method. Do not remove a named query already there.

```ts
import type { Repository } from '@cellix/domain-seedwork/repository';
import type { <Subdomain>, <Subdomain>Props } from './<subdomain>.aggregate.ts';

export interface <Subdomain>Repository<props extends <Subdomain>Props> extends Repository<<Subdomain><props>> {
	getNewInstance(<field>: string): Promise<<Subdomain><props>>;
	getById(id: string): Promise<<Subdomain><props>>;
}
```
