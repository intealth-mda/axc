# `index.ts`

Path: `<application-services>/contexts/<context>/<subdomain>/index.ts`

Add each named action to this interface and to the factory return. Do not replace the file.

```ts
import type { Domain } from '<scope>/domain';
import type { DataSources } from '<scope>/persistence';
import { type <Subdomain>QueryByIdCommand, queryById } from './query-by-id.ts';

export interface <Subdomain>ApplicationService {
	queryById: (command: <Subdomain>QueryByIdCommand) => Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference | null>;
}

export const <Subdomain> = (dataSources: DataSources): <Subdomain>ApplicationService => ({
	queryById: queryById(dataSources),
});
```
