# Persistence `<context>/index.ts`

Path: `<persistence>/datasources/domain/<context>/index.ts`

Create this when the context has no persistence index. When it exists, add the `<Subdomain>` property. Do not replace the factory.

```ts
import type { Domain } from '<scope>/domain';
import type { ModelsContext } from '../../../index.ts';
import * as <Subdomain> from './<subdomain>/index.ts';

export const <Context>ContextPersistence = (models: ModelsContext, passport: Domain.Passport) => ({
	<Subdomain>: <Subdomain>.<Subdomain>Persistence(models, passport),
});
```
