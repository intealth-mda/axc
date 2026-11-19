# Persistence `<subdomain>.uow.ts`

Path: `<persistence>/datasources/domain/<context>/<subdomain>/<subdomain>.uow.ts`

```ts
import { InProcEventBusInstance, NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
import type { <Subdomain>ModelType } from '<scope>/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Domain } from '<scope>/domain';
import { <Subdomain>Converter } from './<subdomain>.domain-adapter.ts';
import { <Subdomain>Repository } from './<subdomain>.repository.ts';

export const get<Subdomain>UnitOfWork = (model: <Subdomain>ModelType, passport: Domain.Passport): Domain.Contexts.<Context>.<Subdomain>.<Subdomain>UnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(InProcEventBusInstance, NodeEventBusInstance, model, new <Subdomain>Converter(), <Subdomain>Repository);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
```
