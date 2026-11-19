# `query-by-id.ts`

Path: `<application-services>/contexts/<context>/<subdomain>/query-by-id.ts`

Write this with every new subdomain. The barrel is [subdomain.index.md](subdomain.index.md).

```ts
import type { Domain } from '<scope>/domain';
import type { DataSources } from '<scope>/persistence';

export interface <Subdomain>QueryByIdCommand {
	id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: <Subdomain>QueryByIdCommand): Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference | null> => {
		return await dataSources.readonlyDataSource.<Context>.<Subdomain>.<Subdomain>ReadRepo.getById(command.id);
	};
};
```
