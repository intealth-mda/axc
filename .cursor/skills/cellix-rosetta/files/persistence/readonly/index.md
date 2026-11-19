# `index.ts`

Path: `<persistence>/datasources/readonly/index.ts`

Add the nested member on `ReadonlyDataSource` and the same key on `ReadonlyDataSourceImplementation`. Do not replace the file, and do not drop another context.

```ts
export interface ReadonlyDataSource {
	<Context>: {
		<Subdomain>: {
			<Subdomain>ReadRepo: <Subdomain>ReadRepository;
		};
	};
}

export const ReadonlyDataSourceImplementation = (models: ModelsContext, passport: Domain.Passport): ReadonlyDataSource => ({
	<Context>: <Context>Context(models, passport),
});
```

Import `<Context>Context` from `./<context>/index.ts` and `<Subdomain>ReadRepository` from `./<context>/<subdomain>/<subdomain>.read-repository.ts` when those imports are missing. When `<Context>:` is already on the interface, add only the `<Subdomain>` block.
