# `<subdomain>.model.ts`

Path: `<models>/models/<subdomain>/<subdomain>.model.ts`

This folder is the schema. Do not add `<subdomain>.seed.ts` here. The example document is [subdomain.seed.md](../server-mongodb-memory-mock/subdomain.seed.md), at `apps/server-mongodb-memory-mock/src/seed/<subdomain>.ts`.

A value-object schema uses `{ _id: false, timestamps: true, versionKey: 'version' }`. An entity schema uses `{ timestamps: true, versionKey: 'version' }` and the parent field is an array of that schema. A value-array uses the value-object schema inside an array. Declare nested schemas inside-out so a child schema exists before its parent.

| Prop type | Schema field |
| --- | --- |
| `string` | `{ type: String, required: true, minlength: 1, maxlength: 200 }` |
| `string \| null` | `{ type: String, required: false, default: null }` |
| `number` / `number \| null` | `{ type: Number, required: true }` or `required: false, default: null` |
| `boolean` | `{ type: Boolean, required: true }` or `required: false, default: null` |
| `date` | `{ type: Date, required: true }` or `required: false, default: null` |
| `string[]` | `{ type: [String], required: true }` or `required: false, default: null` |
| union of string literals | `{ type: String, required: true }` or `required: false, default: null` |
| ObjectId with `reference:` | `{ type: Schema.Types.ObjectId, ref: '<Reference>', required: true }` or `required: false` when optional |
| ObjectId with no reference | `{ type: Schema.Types.ObjectId, required: false, default: null }` |
| value object | the nested schema object |
| entity or value-array | `[<Nested>Schema]` |

`constraints.unique` adds `.index({ <field>: 1 }, { unique: true })` on the root schema.

The root interface extends `MongooseSeedwork.Base`. An entity interface extends `MongooseSeedwork.SubdocumentBase` and is named `<Nested>Doc`. A value-object interface is named `<Nested>Doc` and does not extend. Import `Types` from `mongoose` when any entity or ObjectId field exists. An entity field is `Types.DocumentArray<<Nested>Doc>`. A value-array field is `<Nested>Doc[]`.

```ts
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema, Types } from 'mongoose';

export interface <Subdomain> extends MongooseSeedwork.Base {
	<field>: string;
	<nested>: <Nested>Doc;
}

const <Subdomain>Schema = new Schema<<Subdomain>, Model<<Subdomain>>, <Subdomain>>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
		<field>: { type: String, required: true, minlength: 1, maxlength: 200 },
		<nested>: <Nested>Schema,
	},
	{ timestamps: true, versionKey: 'version', collection: '<collection>' },
);

export const <Subdomain>ModelName = '<Subdomain>';
export const <Subdomain>ModelFactory = MongooseSeedwork.modelFactory<<Subdomain>>(<Subdomain>ModelName, <Subdomain>Schema);
export type <Subdomain>ModelType = ReturnType<typeof <Subdomain>ModelFactory>;
```

`<collection>` is the sheet's `collection:` line. Do not substitute `<subdomain>`, and do not pick another name when a model already uses that collection. An empty line stops the write. Ask for the collection in the prompt.
