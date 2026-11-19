# Domain `<subdomain>/index.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/index.ts`

Create this for a new subdomain. When the file exists, add the missing export in the form the file already uses. Do not replace it.

```ts
export type { <Subdomain>Repository } from './<subdomain>.repository.ts';
export { <Subdomain>, type <Subdomain>EntityReference, type <Subdomain>Props } from './<subdomain>.aggregate.ts';
export type { <Subdomain>UnitOfWork } from './<subdomain>.uow.ts';
export * as ValueObjects from './<subdomain>.value-objects.ts';
```

Export each nested class and its props type by name, so `Domain.Contexts.<Context>.<Subdomain>.<Nested>Props` resolves:

```ts
export { <Nested>, type <Nested>Props } from './<nested>.value-object.ts';
export { <Child>, type <Child>Props, type <Child>EntityReference } from './<child>.entity.ts';
```

Do not `export *` from two files that declare the same class name. A second `<Field>` is `<Nested><Field>` in its file, and the barrel exports that name.
