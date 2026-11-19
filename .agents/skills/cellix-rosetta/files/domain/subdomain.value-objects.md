# `<subdomain>.value-objects.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<subdomain>.value-objects.ts`

One class per root string that has a length or a pattern. The class body stays empty. A plain string assigns the argument in the setter and does not get a class. Omit this file when every root string is plain.

A required `<field>`:

```ts
import { VOString } from '@lucaspaganini/value-objects';

export class <Field> extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
```

An optional `<field>`:

```ts
import { VOOptional, VOString } from '@lucaspaganini/value-objects';

class <Field>Base extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class <Field> extends VOOptional(<Field>Base, [null]) {}
```

Replace `minLength`, `maxLength`, and `trim` from Recommended Datatype. Add `pattern` only when that cell already contains a regex.
