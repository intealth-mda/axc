# `<nested>.value-objects.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<nested>.value-objects.ts`

One empty `VOString` or `VOOptional` class per string on the entity that has a length or a pattern. A plain string assigns the argument and does not get a class. Omit this file when every string on the entity is plain. The rules are [subdomain.value-objects.md](subdomain.value-objects.md). The entity imports them as `import * as ValueObjects from './<nested>.value-objects.ts'`.
