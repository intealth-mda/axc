# `index.ts`

Path: `<persistence>/datasources/readonly/<context>/<subdomain>/index.ts`

Add the member. Do not replace the file.

```ts
import type { Domain } from '<scope>/domain';
import type { ModelsContext } from '../../../../index.ts';
import { get<Subdomain>ReadRepository, type <Subdomain>ReadRepository } from './<subdomain>.read-repository.ts';

export const <Subdomain>ReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	const repository: <Subdomain>ReadRepository = get<Subdomain>ReadRepository(models, passport);
	return {
		<Subdomain>ReadRepo: repository,
	};
};
```

An existing `export * from './<subdomain>.read-repository.ts'` barrel stays that way. The context index then calls `get<Subdomain>ReadRepository`.
