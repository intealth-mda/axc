# `<context>/index.ts`

Path: `<domain>/domain/contexts/<context>/index.ts`

Create this when the context is new. When it exists, add the subdomain export. Do not drop the permissions, visa, or passport exports already there.

```ts
export * as <Subdomain> from './<subdomain>/index.ts';
export type { <Context>DomainPermissions } from './<context>.domain-permissions.ts';
export type { <Context>Visa } from './<context>.visa.ts';
export type { <Context>Passport } from './<context>.passport.ts';
```

An existing barrel adds `export * as <Subdomain>`. Do not add `export * from` for that subdomain. Leave a permissions, visa, or passport export that is already there.
