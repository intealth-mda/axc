# Application `<context>/index.ts`

Path: `<application-services>/contexts/<context>/index.ts`

Create this when the context has no application index. When it exists, add the `<Subdomain>` property on the interface and on the factory return. Do not replace the file.

```ts
import type { DataSources } from '<scope>/persistence';
import { <Subdomain> as <Subdomain>Api, type <Subdomain>ApplicationService } from './<subdomain>/index.ts';

export interface <Context>ContextApplicationService {
	<Subdomain>: <Subdomain>ApplicationService;
}

export const <Context> = (dataSources: DataSources): <Context>ContextApplicationService => {
	return {
		<Subdomain>: <Subdomain>Api(dataSources),
	};
};
```
