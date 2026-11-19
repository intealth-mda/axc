# `<subdomain>.aggregate.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<subdomain>.aggregate.ts`

A subdomain named `role`, or whose name ends in `-role`, is not this page. It is [role.aggregate.md](role.aggregate.md).

Root fields, then nested props, then the three readonly timestamps. `getNewInstance` takes the root scalars and an existing aggregate reference, and assigns the scalars through the setters. It does not take a value object, a value-array, or an entity collection, and it does not assign `this.props.<nested>`. Fill a value object through its setters. Add a collection with `requestNew<Nested>()` that returns `new <Nested>(this.props.<nested>.getNewItem(), this.visa)`.

`getNewInstance` and `markAsNew` are on every aggregate. `getNewInstance` calls `markAsNew` before the setters, then sets `isNew` to false.

`isNew` is set while `getNewInstance` assigns the root scalars, then set back to false. A string setter wraps `ValueObjects.<Field>`. A value-object getter is `return new <Nested>(this.props.<nested>, this.visa)` when the child only checks a permission. An entity getter maps `this.props.<nested>.items`. Permission checks on setters are not written yet.

A child that reads or writes a field on another level takes `root`. The aggregate exports `interface I<Subdomain>AggregateRoot extends RootEventRegistry` and implements it. The interface lists the getters and `request*` methods those children call. It does not list the whole aggregate. The getter passes `this`:

```ts
export interface I<Subdomain>AggregateRoot extends RootEventRegistry {
	get <sibling>(): <Sibling>;
	requestAdd<Child>(...): void;
}

get <nested>(): <Nested> {
	return new <Nested>(this.props.<nested>, this);
}
```

The child keeps `private readonly root: I<Subdomain>AggregateRoot` and assigns `this.root = root` in the constructor body. It reaches the other level as `this.root.<sibling>` or `this.root.requestAdd<Child>(...)`. A grandchild receives that same object: `new <Child>(this.props.<child>, this.root)`. Do not pass the sibling's props, and do not take the aggregate class.

```ts
import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { type DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Passport } from '../../passport.ts';
import type { <Context>Visa } from '../<context>.visa.ts';
import { <Nested>, type <Nested>Props } from './<nested>.value-object.ts';
import * as ValueObjects from './<subdomain>.value-objects.ts';

export interface <Subdomain>Props extends DomainEntityProps {
	<field>: string;
	<nested>: <Nested>Props;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface <Subdomain>EntityReference extends Readonly<Omit<<Subdomain>Props, '<nested>'>> {
	readonly <nested>: <Nested>;
}

export class <Subdomain><props extends <Subdomain>Props> extends AggregateRoot<props, Passport> implements <Subdomain>EntityReference {
	private isNew: boolean = false;
	private readonly visa: <Context>Visa;
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.<contextCamel>.for<Subdomain>(this);
	}

	public static getNewInstance<props extends <Subdomain>Props>(newProps: props, <field>: string, passport: Passport): <Subdomain><props> {
		const newInstance = new <Subdomain>(newProps, passport);
		newInstance.markAsNew();
		newInstance.<field> = <field>;
		newInstance.isNew = false;
		return newInstance;
	}

	private markAsNew(): void {
		this.isNew = true;
	}

	get <field>(): string {
		return this.props.<field>;
	}
	set <field>(<field>: string) {
		this.props.<field> = new ValueObjects.<Field>(<field>).valueOf();
	}

	get <nested>(): <Nested> {
		return new <Nested>(this.props.<nested>, this.visa);
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}
```

The setter above is a string with a length or a pattern. A plain string assigns the argument: `this.props.<field> = <field>`.

Import `PropArray` only when a root prop is an entity collection. The prop type is then `PropArray<<Nested>Props>` and the reference member is `ReadonlyArray<<Nested>EntityReference>`. Drop the `Omit` and use `Readonly<<Subdomain>Props>` when nothing is nested.

An ObjectId that names `reference:` is that aggregate's entity reference when that aggregate exists in the repo. The props hold the reference and `load<Reference>`. The getter builds the other aggregate. The setter writes only while `isNew` is true. `load<Reference>` forwards to the prop. When the other aggregate does not exist, the prop stays `string` or `string | null`. Do not invent the missing aggregate. An ObjectId with no reference stays `string`.

```ts
<reference>: Readonly<<Other>EntityReference>;
load<Reference>: () => Promise<<Other>EntityReference>;
```

```ts
get <reference>(): <Other>EntityReference {
	return new <Other>(this.props.<reference>, this.passport);
}
private set <reference>(<reference>: <Other>EntityReference) {
	if (!this.isNew) {
		throw new PermissionError('Unauthorized');
	}
	this.props.<reference> = <reference>;
}
async load<Reference>(): Promise<<Other>EntityReference> {
	return await this.props.load<Reference>();
}
```

A nested prop the shape marks `null` is `<Nested>Props | null`. The getter returns `null` when `this.props.<nested>` is missing.
