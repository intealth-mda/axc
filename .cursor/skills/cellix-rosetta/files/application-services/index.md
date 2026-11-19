# `ApplicationServices`

Path: `<application-services>/index.ts`

Add the context. Do not rewrite `forRequest` or the permissions already in the file.

Import the context factory when it is missing:

```ts
import { <Context>, type <Context>ContextApplicationService } from './contexts/<context>/index.ts';
```

Add the property on `export interface ApplicationServices`:

```ts
<Context>: <Context>ContextApplicationService;
```

Add the same key where the other contexts are constructed:

```ts
<Context>: <Context>(dataSources),
```
