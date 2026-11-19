# `index.ts`

Path: `<domain>/index.ts`

Add the member on `export interface DomainDataSource`. Do not replace the interface. The persistence implementation is [index.md](../persistence/domain/index.md).

```ts
<Context>: {
	<Subdomain>: {
		<Subdomain>UnitOfWork: Contexts.<Context>.<Subdomain>.<Subdomain>UnitOfWork;
	};
};
```

When `<Context>:` is already in the interface, add only the `<Subdomain>` block inside it.
