# `index.ts`

Path: `<persistence>/datasources/domain/index.ts`

Add the member on `DomainDataSourceImplementation`. Do not replace the implementation. The domain interface is [index.md](../../domain/index.md).

```ts
<Context>: <Context>ContextPersistence(models, passport),
```

Import `<Context>ContextPersistence` from `./<context>/index.ts` when that import is missing.
