# `<context>.visa.ts`

Path: `<domain>/domain/contexts/<context>/<context>.visa.ts`

Create once per context.

```ts
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { <Context>DomainPermissions } from './<context>.domain-permissions.ts';

export interface <Context>Visa extends Visa<<Context>DomainPermissions> {
	determineIf(func: (permissions: Readonly<<Context>DomainPermissions>) => boolean): boolean;
}
```
