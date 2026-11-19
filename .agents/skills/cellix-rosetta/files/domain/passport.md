# `passport.ts`

Path: `<domain>/domain/contexts/passport.ts`

Create it for the first context. When it exists, add `for<Subdomain>` on the existing `<contextCamel>` key, or add the key. Match the passport shape already in the repo. `forSystem` returns every permission as `true`.

```ts
import type { <Context>Visa } from './<context>/<context>.visa.ts';

export interface Passport {
	<contextCamel>: {
		for<Subdomain>(entity: unknown): <Context>Visa;
	};
}

export const PassportFactory = {
	forSystem(): Passport {
		return {
			<contextCamel>: {
				for<Subdomain>: (): <Context>Visa => ({
					determineIf: (check) => check({ <permission>: true }),
				}),
			},
		};
	},
};
```

The sample object is for a repo that has no passport yet. A repo that already has a class with a getter per context keeps that shape. Add the getter. Do not replace the class with the object above.

A context passport is [context.passport.md](context.passport.md). A system passport class per context is [system.context.passport.md](system.context.passport.md).
