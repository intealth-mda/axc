# `<subdomain>.uow.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<subdomain>.uow.ts`

```ts
import type { InitializedUnitOfWork, UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { <Subdomain>, <Subdomain>Props } from './<subdomain>.aggregate.ts';
import type { <Subdomain>Repository } from './<subdomain>.repository.ts';

export interface <Subdomain>UnitOfWork extends UnitOfWork<Passport, <Subdomain>Props, <Subdomain><<Subdomain>Props>, <Subdomain>Repository<<Subdomain>Props>>, InitializedUnitOfWork<Passport, <Subdomain>Props, <Subdomain><<Subdomain>Props>, <Subdomain>Repository<<Subdomain>Props>> {}
```
