# `index.ts`

Path: `<persistence>/datasources/readonly/<context>/index.ts`

Add the `<Subdomain>` property. Do not replace the factory, and do not drop another context.

```ts
import type { Domain } from '<scope>/domain';
import type { ModelsContext } from '../../../index.ts';
import { <Subdomain>ReadRepositoryImpl } from './<subdomain>/index.ts';

export const <Context>Context = (models: ModelsContext, passport: Domain.Passport) => ({
	<Subdomain>: <Subdomain>ReadRepositoryImpl(models, passport),
});
```
