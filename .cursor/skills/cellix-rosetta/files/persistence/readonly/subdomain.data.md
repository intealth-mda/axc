# `<subdomain>.data.ts`

Path: `<persistence>/datasources/readonly/<context>/<subdomain>/<subdomain>.data.ts`

`mongo-data-source.ts` is already at `<persistence>/datasources/readonly/mongo-data-source.ts`. Import it. Do not write it again. The import is two directories up (`../../mongo-data-source.ts`).

```ts
import type { <Subdomain> } from '<scope>/data-sources-mongoose-models';
import { MongoDataSourceImpl, type MongoDataSource } from '../../mongo-data-source.ts';

export interface <Subdomain>DataSource extends MongoDataSource<<Subdomain>> {}

export class <Subdomain>DataSourceImpl extends MongoDataSourceImpl<<Subdomain>> implements <Subdomain>DataSource {}
```
