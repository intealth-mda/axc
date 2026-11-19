# `<subdomain>.ts`

Path: `apps/server-mongodb-memory-mock/src/seed/<subdomain>.ts`

Add the import on `apps/server-mongodb-memory-mock/src/seed/seed.ts`. Do not put the seed in the mongoose model package.

One object. `_id` is `'000000000000000000000001'`, `schemaVersion` is `'1.0.0'`, `version` is `0`, `createdAt` and `updatedAt` are `new Date('2024-01-01T00:00:00.000Z')`.

| Type | Sample |
| --- | --- |
| `string`, or a union with no quoted literal | `'Example <field>'` |
| quoted union | the first literal |
| `boolean` | `false` |
| `date` | the date above |
| `number` | `1` |
| `number \| null` | `null` |
| `boolean \| null`, `date \| null` | `null` |
| `string \| null` | `null` |
| array | `['a']`, shortened or lengthened to the item `maxLength` |
| `string` with `maxLength` | a string of that length, not `'Example <field>'` when that sample is longer |
| value object | one object |
| entity or value-array | a one-element array |

```ts
/** Insert <subdomainCamel>Seed into the <Subdomain> collection. One object is the example. A catalog task adds the other rows to this array. Start the application and read them back through the endpoint. Do not copy this document into a handler, a read repository, or an in-memory catalog. */
export const <subdomainCamel>Seed = [
	{
		_id: '000000000000000000000001',
		schemaVersion: '1.0.0',
		version: 0,
		<field>: 'Example <field>',
		<nested>: { <field>: 'Example <field>', <child>: [{ <field>: 'Example <field>' }] },
		createdAt: new Date('2024-01-01T00:00:00.000Z'),
		updatedAt: new Date('2024-01-01T00:00:00.000Z'),
	},
];
// collection.insertMany(<subdomainCamel>Seed as unknown as Parameters<typeof collection.insertMany>[0])
```

Do not put the seed in a handler or a read repository.
