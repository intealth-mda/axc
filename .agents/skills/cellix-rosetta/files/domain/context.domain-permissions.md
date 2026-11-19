# `<context>.domain-permissions.ts`

Path: `<domain>/domain/contexts/<context>/<context>.domain-permissions.ts`

Create the file when the context is new. When it exists, add the missing property. Do not remove a permission another subdomain uses.

```ts
export interface <Context>DomainPermissions {
	<permission>: boolean;
}
```
