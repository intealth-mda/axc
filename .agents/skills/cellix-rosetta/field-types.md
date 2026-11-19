# Field types

The shape section of [excel/read.md](excel/read.md) already applies this. Trust its `fields` and `nested` arrays. Use this page when you are going from code back to rows, or when a cell is outside that shape.

## Field type

| DataType | Type on the prop |
| --- | --- |
| `string` required | `string` |
| `string` optional | `string \| null` |
| `number` / `boolean` / `date` | that word, plus `\| null` when optional |
| `timestamp` | `date`, plus `\| null` when optional |
| `ObjectId` that is not `_id` and names `reference:` to an aggregate in the repo | that aggregate's entity reference, plus `load<Name>()` on the aggregate. The mongoose field is `ObjectId` with `ref`. The adapter populates it. |
| `ObjectId` that names `reference:` and that aggregate is not in the repo | the shape type, `string` or `string \| null`. The mongoose field still has `ref`. Do not invent the aggregate. |
| `ObjectId` that is not `_id` and names no reference | `string` in domain props. The mongoose field is still ObjectId. Record `constraints.storage = "ObjectId"`. |
| `name []` or `array` of a scalar | `string[]`, `number[]`, `boolean[]`, or `date[]`, plus `\| null` when the array is optional |
| `accepted values: Open, Closed` | `'Open' \| 'Closed'`, plus `\| null` when optional |

A closed accepted-values list is two or more tokens of letters, digits, and underscores. `current <Name> list`, `runtime-recognized values`, and `seeded values` stay `string` or `number`. Copy the phrase into the row's rules. Do not invent a union.

`length: 8` sets both `minLength` and `maxLength` to 8. `pattern: digits only` stays a note. Do not invent a regex unless the cell already contains one.

## Four nested kinds

| Sheet | `kind` | Prop type |
| --- | --- | --- |
| `<nested> {` … `}` and no `_id` | `value` | `<Nested>Props` |
| `<child> [{` … `_id` … `}]` | `entity` | `PropArray<<Child>Props>` |
| `[{` … `}]` with no `_id` | `value-array` | `<Child>Props[]` |
| a nested block inside any of those | the same three | the parent holds the child |

`kind: entity` inside `kind: value` is normal. `<nested>.<child>` is a `PropArray` on `<Nested>Props`. The aggregate prop is `<nested>`, not `<child>`. Do not hoist the collection.

An entity inside an entity is also normal (`<nested> [{` containing `<child> {`). A value object inside an entity is normal.

## Value objects and strings

A string with `length`, `minLength`, `maxLength`, or `pattern` gets a `VOString`. An optional constrained string gets `VOOptional` around that `VOString`. The prop type stays `string | null`. A plain string assigns the argument and gets no class. A `string[]` whose items are constrained gets `VOArray`. Unions, numbers, dates, and booleans are assigned directly.

Default options, then replace them from Recommended Datatype:

```ts
import { VOOptional, VOString } from '@lucaspaganini/value-objects';

class <Field>Base extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class <Field> extends VOOptional(<Field>Base, [null]) {}
```

The class body stays empty. `pattern` is added as a property of that object when the recommendation contains a regex. `constraints.unique` becomes a unique index on the mongoose schema. It does not change the value object.

## Owned names

Do not declare these as fields on the aggregate: root `_id`, `schemaVersion`, `createdAt`, `updatedAt`. The aggregate props list the three timestamps as `readonly`. The entity props list `createdAt` and `updatedAt` as `readonly`. A value object does not gain them unless the sheet lists them inside that object as ordinary fields. Prefer skipping them there too. The mongoose value-object schema still sets `timestamps: true`.

On a sheet written from code, root `_id` and root `schemaVersion` are still the first property rows. They come from the mongoose model, which extends `MongooseSeedwork.Base`. The aggregate does not declare `_id` — `DomainEntityProps` calls it `id` — and it lists `schemaVersion` only as a readonly timestamp. Walking the aggregate drops `_id` and leaves `schemaVersion` off the top of the sheet.

`dataVersion` is a real field when the sheet has it.

## Permissions

The role matrix is not a permission list. A new subdomain uses one permission, `canManage<Subdomain>`, on the context permissions interface. Setter permission checks are not written yet. Do not invent a permission from a column header.

A role subdomain does not take its flags from the sheet yet. Map them in [files/domain/role.aggregate.md](files/domain/role.aggregate.md): one `<subdomain>-permissions.ts`, and one `<subdomain>-<group>-permissions.ts` per group, the same way a subdomain is mapped onto its files.

## From code back to rows

[excel/write.md](excel/write.md) writes this object into the workbook. Do not save it as a file. Put `dataType` on every field. That string is the DataType cell. `type` is only how an array gets the `[]` suffix.

```json
{
  "sheet": "<subdomain>",
  "collection": "<mongo collection>",
  "fields": [{ "name": "<field>", "type": "string", "dataType": "string; required" }],
  "nested": [{ "name": "<nested>", "kind": "value", "fields": [] }]
}
```

`kind` is `value`, `entity`, or `value-array`. A nested block's children go in its `fields` array, including another nested block. Leave root `_id`, `schemaVersion`, `createdAt`, and `updatedAt` out of `fields`. `write` inserts them.

Read root `_id` and root `schemaVersion` from the mongoose model, not from the aggregate. The model interface extends `MongooseSeedwork.Base`, which owns `id` and `schemaVersion`. The schema field is `schemaVersion: { type: String, default: '1.0.0' }`. `write` places these two rows before `fields`, in this order:

| Row | `dataType` |
| --- | --- |
| `_id` | `ObjectId; required; unique; system-generated` |
| `schemaVersion` | `string; default: 1.0.0; system-populated` |

Pass `idDataType` when the existing sheet's `_id` cell differs from that default.

`write` still appends root `createdAt` and `updatedAt` after the nested blocks. Pass `createdAtDataType` and `updatedAtDataType` when the schema says more than `timestamp; system-generated`. Fields that sit after those timestamps on the schema, such as `createdUser` and `updatedUser`, go in `afterTimestamps`. `write` also inserts `_id` inside an `entity` block.

Pass `schemaVersionDataType` from the mongoose path. Include `required` when the path is required, and `default: '<value>'` from that path's default. A video model whose default is `1.0.0` stays `string; default: 1.0.0; system-populated`. A path whose default is `1.0` is `string; required; default: '1.0'`.

Walk the mongoose schema in path order, and the matching props interface for nullability. This is the reverse of `read`: every path becomes a row `read` would return, including nested blocks. Do not stop at the root scalars. Skip methods, `load<Field>`, derived getters, and members that exist only on the reference interface. A path that exists only on the schema is still a row. Skip `schemaVersion`, `createdAt`, and `updatedAt` inside an entity. A value-object schema with `timestamps: true` does not add those rows.

An array path is `[{`. When that array schema does not set `_id: false`, the block is `kind: entity` and the sheet has an `_id` row. Mongoose gives array elements an `_id` unless the schema turns it off. `NestedPathOptions` sets `_id: false`, so that object is `kind: value` with no `_id` row. A `[{` whose schema sets `_id: false` is `kind: value-array`.

| Prop | `type` | `dataType` |
| --- | --- | --- |
| `<field>: string` | `string` | `string; required` |
| `<field>: string \| null` | `string\|null` | `string; optional` |
| `<field>: number` | `number` | `number; required` |
| `<field>: number \| null` | `number\|null` | `number; optional` |
| `<field>: boolean` | `boolean` | `boolean; required` |
| `<field>: Date` | `date` | `date; required`, or `date; optional` when the prop includes `null` |
| `<field>: 'Open' \| 'Closed'` | `'Open'\|'Closed'` | `string; required; accepted values: Open, Closed` |
| `<field>: 'Open' \| 'Closed' \| null` | `'Open'\|'Closed'\|null` | `string; optional; accepted values: Open, Closed` |
| `<field>: string[]` | `string[]` | `array; item type: string` |
| `<field>: string[] \| null` | `string[]\|null` | `array; optional; item type: string` |
| `<nested>: <Nested>Props` | nested `kind: value` | |
| `<child>: PropArray<<Child>Props>` | nested `kind: entity` | |
| `<child>: <Child>Props[]` | nested `kind: value-array` | |

A unique index adds `; unique` to that field's `dataType`. An ObjectId column is `ObjectId; required` or `ObjectId; optional`. `ref: '<Reference>'` adds `; reference: <Reference>`. The domain prop stays `string` either way.

`VOString` options become Recommended Datatype on that field: `trim: true; minLength: 1; maxLength: 200`, plus `pattern: <regex>` when the class has one. `VOOptional` does not change `dataType`; the prop's `null` already made it optional.

Nest the collection under the object that declares it. `<child>` on `<Nested>Props` is a nested block inside `<nested>`, not a root field.
