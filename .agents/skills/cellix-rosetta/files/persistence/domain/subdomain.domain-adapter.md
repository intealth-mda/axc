# `<subdomain>.domain-adapter.ts`

Path: `<persistence>/datasources/domain/<context>/<subdomain>/<subdomain>.domain-adapter.ts`

Every nested value and every entity gets its own adapter class. The root getter for a required value object creates the subdocument when it is missing, then returns that adapter. A value object the shape marks `null` returns `null` when the path is missing and does not create the subdocument. An entity collection is `MongoosePropArray`. Declare `readonly doc` and assign it in the constructor body. The nested props type is `Domain.Contexts.<Context>.<Subdomain>.<Nested>Props`, and the subdomain index exports that name.

```ts
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { <Subdomain>, <Nested>Doc, <Child>Doc } from '<scope>/data-sources-mongoose-models';
import { Domain } from '<scope>/domain';

class <Child>DomainAdapter implements Domain.Contexts.<Context>.<Subdomain>.<Child>Props {
	readonly doc: <Child>Doc;
	constructor(doc: <Child>Doc) {
		this.doc = doc;
	}

	get id(): string {
		return this.doc.id?.valueOf() as string;
	}
	get createdAt(): Date {
		return this.doc.createdAt as Date;
	}
	get updatedAt(): Date {
		return this.doc.updatedAt as Date;
	}
	get <field>(): string {
		return this.doc.<field>;
	}
	set <field>(<field>: string) {
		this.doc.<field> = <field>;
	}
}

class <Nested>DomainAdapter implements Domain.Contexts.<Context>.<Subdomain>.<Nested>Props {
	readonly doc: <Nested>Doc;
	constructor(doc: <Nested>Doc) {
		this.doc = doc;
	}

	get <field>(): string | null {
		return this.doc.<field>;
	}
	set <field>(<field>: string | null) {
		this.doc.<field> = <field>;
	}
	get <child>(): PropArray<Domain.Contexts.<Context>.<Subdomain>.<Child>Props> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.<child>, <Child>DomainAdapter);
	}
}

export class <Subdomain>Converter extends MongooseSeedwork.MongoTypeConverter<
	<Subdomain>,
	<Subdomain>DomainAdapter,
	Domain.Passport,
	Domain.Contexts.<Context>.<Subdomain>.<Subdomain><<Subdomain>DomainAdapter>
> {
	constructor() {
		super(<Subdomain>DomainAdapter, Domain.Contexts.<Context>.<Subdomain>.<Subdomain>);
	}
}

export class <Subdomain>DomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<<Subdomain>> implements Domain.Contexts.<Context>.<Subdomain>.<Subdomain>Props {
	get <field>(): string {
		return this.doc.<field>;
	}
	set <field>(<field>: string) {
		this.doc.<field> = <field>;
	}
	get <nested>(): Domain.Contexts.<Context>.<Subdomain>.<Nested>Props {
		if (!this.doc.<nested>) {
			this.doc.set('<nested>', {});
		}
		return new <Nested>DomainAdapter(this.doc.<nested>);
	}
}
```

An ObjectId field's getter returns `String(value)` and the setter assigns through a cast to the document field's type. A referenced aggregate follows the populate pattern already used in the repo: return the other adapter when populated, and `load<Field>` populates then returns it.
