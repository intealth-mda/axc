# `<nested>.value-object.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<nested>.value-object.ts`

A `value` block. String classes sit above the props. Import a child value object from its file. Import a child entity from `<nested>.entity.ts`. A child value-array is `<Nested>Props[]`.

The constructor takes the visa when a child will need it later. Declare `private readonly visa` and assign it in the body. A parameter property fails `erasableSyntaxOnly`. Permission checks on setters are not written yet.

```ts
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { VOOptional, VOString } from '@lucaspaganini/value-objects';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { <Context>Visa } from '../<context>.visa.ts';
import { <Child>, type <Child>EntityReference, type <Child>Props } from './<child>.entity.ts';

class <Field>Base extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class <Field> extends VOOptional(<Field>Base, [null]) {}

export interface <Nested>Props extends ValueObjectProps {
	<field>: string | null;
	<child>: PropArray<<Child>Props>;
}

export class <Nested> extends ValueObject<<Nested>Props> {
	private readonly visa: <Context>Visa;
	constructor(props: <Nested>Props, visa: <Context>Visa) {
		super(props);
		this.visa = visa;
	}

	get <field>(): string | null {
		return this.props.<field>;
	}
	set <field>(<field>: string | null) {
		this.props.<field> = new <Field>(<field>).valueOf();
	}

	get <child>(): ReadonlyArray<<Child>EntityReference> {
		return this.props.<child>.items.map((entry) => new <Child>(entry, this.visa));
	}
}
```

A string with a length or a pattern uses `VOString` and the prop type `string`. A plain string assigns the argument. A `string[]` whose items are constrained uses `VOArray`. Unions, numbers, dates, and booleans assign the argument. A required nested value getter is `return new <Nested>(this.props.<nested>, this.visa)`. A nested value the shape marks `null` is `<Nested>Props | null` and returns `this.props.<nested> ? new <Nested>(this.props.<nested>, this.visa) : null`. A value-array getter returns `this.props.<nested>`. Drop the `PropArray` import when this object has no entity child.

A child that reads a field outside its own props takes `root` instead of, or as well as, the visa. The type is the aggregate interface `I<Subdomain>AggregateRoot`. Assign `this.root = root` in the constructor body. Read and write the other level only through `this.root.<field>` and `this.root.request*()`. Pass `this.root` into a grandchild that also takes `root`. A child that stays inside its own props does not declare `root`.

```ts
export class <Nested> extends ValueObject<<Nested>Props> {
	private readonly root: I<Subdomain>AggregateRoot;
	constructor(props: <Nested>Props, root: I<Subdomain>AggregateRoot) {
		super(props);
		this.root = root;
	}

	public requestUpdate<Field>(<field>: string): void {
		this.<field> = <field>;
		this.root.requestAdd<Child>(...);
	}
}
```

When `<nested>` is already a file in this folder, this file is `<parent>-<nested>.value-object.ts` and the class is `<Parent><Nested>`. When `<Field>` is already exported in this folder, the class is `<Nested><Field>`.
