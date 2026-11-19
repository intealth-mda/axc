# Field edits

[Report the differences](workflows/report-differences.md) reads "Find the files" and stops. [Update an existing subdomain](workflows/update-existing-subdomain.md) continues into "Add", "Remove", and "Change a type".

## Find the files

`shape` prints `context` and `subdomain`. The context is the Overview column header. The subdomain is the sheet linked under that header.

Search the subdomain folder, not the whole repo:

```text
<domain>/domain/contexts/<context>/<subdomain>/
<models>/models/<subdomain>/<subdomain>.model.ts
<models>/models/<subdomain>.model.ts
<persistence>/datasources/domain/<context>/<subdomain>/
<persistence>/datasources/readonly/<context>/<subdomain>/
apps/server-mongodb-memory-mock/src/seed/<subdomain>.ts
<application-services>/contexts/<context>/<subdomain>/
<graphql>/<subdomain>.graphql
```

An older model is `models/<subdomain>.model.ts` or a plural filename. Use the one that exists.

The folder context can differ from the Overview header. Open the aggregate that exists for that subdomain and edit it there. Do not add a second copy under the Overview context.

Inside the subdomain directory, the field's owner is the props interface that declares it. `<field>` on the aggregate is `<Nested>Props`. A field inside a collection is on that entity's props. The file may be `<nested>.entity.ts` or a prefixed name already used in the folder. Follow the import. Match that prefix when you add a file.

A getter that is not on a props interface is behavior. Leave it unless the sheet removed the prop it reads.

## Where a field lives

| Change | Aggregate root field | Field on a value object | Field on an entity | New or removed nested block |
| --- | --- | --- | --- | --- |
| Props | `<Subdomain>Props` | that object's `Props` | that entity's `Props` | the parent props |
| Getter and setter | aggregate class | value-object class | entity class | parent getter. An entity getter maps `.items`. A value object that holds an entity takes the visa |
| `VOString` | `<subdomain>.value-objects.ts` when the string has a length or a pattern | the value-object file, or its sibling value-objects file | `<nested>.value-objects.ts` | the constrained string classes for the new block |
| Mongoose | root interface and root schema | nested interface and nested schema | subdocument interface and its schema | new interface, new schema, parent field. Entity and value-array are `[Schema]` |
| Seed | key on the example document | key inside the parent object | key inside the array element | the object, or a one-element array |
| Domain adapter | get/set on the root adapter | get/set on that object's adapter. If the parent is one structural get/set, widen that type | get/set on the entity adapter class | `MongoosePropArray` for an entity. A value object that holds an entity gets its own adapter class |
| `getNewInstance` | add or remove the root scalar, or an existing aggregate reference, on the aggregate, both repositories, and every action that calls it | no. Set it through the child setter | no. A collection starts empty and grows with `getNewItem()` | a nested block is not a `getNewInstance` argument |
| GraphQL, when the file exists | field on the document type and on the create input | field on that nested type and input | field on that nested type. Not a separate create argument | nested `type` and `input`. An entity is `[Name!]!` |

Role letters, legal columns, and rules do not get a line of code. `minLength`, `maxLength`, `pattern`, and `trim` on a required string are the `VOString` options. The class body stays empty.

## Add

Compare the sheet's `shape` tree with the props already in code. Add what the sheet has and the code lacks. Remove what the code has and the sheet lacks. A type that differs is a change of that field, not a second field. Do not create a second aggregate. Do not replace a file with a fresh template. Edit the declaration that already names the field.

Add the prop next to the other props on that interface. Add the getter and setter beside the other members. When the class has `get createdAt`, put them above it. Otherwise put them at the end of the class.

A new string with a length or a pattern gets a `VOString` class. An optional constrained string gets `VOOptional` around a `VOString` base. A plain string, a union, a number, a date, and a boolean assign the argument. They do not get a class.

A new entity inside a value object is a `PropArray` on that value object's props. Import the entity. Pass `this.visa` from the aggregate getter when the child only checks a permission. Pass `this` when the child reads another level through `root`, and pass `this.root` from a parent. The mongoose field is an array of the subdocument schema. The seed puts a one-element array inside the parent object. The adapter reads `this.doc.<collection>` with `MongoosePropArray`.

A new value object is `<Name>Props` plus a class. A new value-array is `<Name>Props[]` and a mongoose array of a schema with `_id: false`.

A root scalar added to `getNewInstance` is one more parameter. An existing aggregate reference is also a parameter. The static method calls `markAsNew`, then assigns each scalar through its setter before `newInstance.isNew = false`. A nested value object or a collection is not a `getNewInstance` parameter. Set it through the child setter, or append a collection entry with `getNewItem()`. The domain repository, the persistence repository, and each `getNewInstance` call gain the same parameter, in the same position. Persistence forwards the name. An action passes `command.<name>`.

Add the seed key before `createdAt` when that line exists. Samples are in [files/server-mongodb-memory-mock/subdomain.seed.md](files/server-mongodb-memory-mock/subdomain.seed.md).

When the GraphQL file exists, add the field to the document type and, for a scalar or value object, to the input type. Do not add an entity collection to the create input.

## Remove

Remove the prop, the getter, the setter, the mongoose interface field, the schema field, the seed key, and the adapter get/set.

Remove a `VOString` class when no setter constructs it.

Remove a `getNewInstance` parameter everywhere it was added: the aggregate signature, the assignment, both repositories, and every call. A call that still passes the old argument does not typecheck.

Removing a nested block removes its prop from the parent, the parent getter, the import, the mongoose schema, the seed value, and the adapter member. Delete `<nested>.entity.ts`, `<nested>.value-object.ts`, and `<nested>.value-objects.ts` when nothing else imports them. Remove the names from the aggregate reference `Omit` list. Do not delete the visa, the passport, or a permission another subdomain uses.

Removing the last field on an entity leaves the `_id` and the timestamps. If the sheet removed the whole `[{` block, remove the collection. Do not leave an empty props interface behind.

## Change a type

Edit the type on the props, the getter, the setter, the mongoose field, and the GraphQL field when that file exists.

| From | To | Also |
| --- | --- | --- |
| `string` | `string \| null` | delete the `VOString` construction when one exists and assign the argument. Schema `required: false, default: null` |
| `string \| null` | `string` | assign the argument. Add the `VOString` class only when the string has a length or a pattern |
| `string` | `'A' \| 'B'` | delete the `VOString`. Schema stays `String` |
| scalar | `date`, `number`, `boolean` | schema `Date`, `Number`, or `Boolean` |
| object `{` | collection `[{` with `_id` | the prop becomes `PropArray`. Add the entity file. The parent getter maps `.items` |
| collection | object `{` | the prop becomes `<Name>Props`. Delete the entity file if the sheet no longer has `_id` |

A length or pattern change edits the existing `VOString` options. It does not add a field.

## Commands

A query or update parameter is not a document field. Change it only when the user names that command. Add the property on the command interface. A query parameter is optional (`name?: type`) and is added to the read-repository method. The method body stays `return Promise.reject(new Error('not implemented'))` until you are filling in behavior. An update parameter is added to the command. The assignment comment inside `withScopedTransaction` stays.

Do not add a sheet field to a command unless that command's input includes it.
