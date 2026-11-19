# Persistence `<subdomain>/index.ts`

Path: `<persistence>/datasources/domain/<context>/<subdomain>/index.ts`

```ts
import type { Domain } from '<scope>/domain';
import type { ModelsContext } from '../../../../index.ts';
import { get<Subdomain>UnitOfWork } from './<subdomain>.uow.ts';

export const <Subdomain>Persistence = (models: ModelsContext, passport: Domain.Passport) => {
	const <Subdomain>Model = models.<Subdomain>;
	return {
		<Subdomain>UnitOfWork: get<Subdomain>UnitOfWork(<Subdomain>Model, passport),
	};
};
```

`../../../../index.ts` is the persistence package index from `datasources/domain/<context>/<subdomain>/index.ts`. If that file does not export `ModelsContext`, copy the relative import a neighboring context already uses.

When this folder already re-exports with `export * from`, add `export * from './<subdomain>.uow.ts'` and keep `<Subdomain>Persistence` on the unit-of-work file. Do not add a second factory.
