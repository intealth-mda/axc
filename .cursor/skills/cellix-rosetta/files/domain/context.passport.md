# `<context>.passport.ts`

Path: `<domain>/domain/contexts/<context>/<context>.passport.ts`

The interface is `for<Subdomain>(root)`. Add `for<Subdomain>` when the subdomain is new. Do not replace the interface.

```ts
import type { <Subdomain>EntityReference } from './<subdomain>/<subdomain>.aggregate.ts';
import type { <Context>Visa } from './<context>.visa.ts';

export interface <Context>Passport {
	for<Subdomain>(root: <Subdomain>EntityReference): <Context>Visa;
}
```
