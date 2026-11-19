# `<nested>.entity.ts`

Path: `<domain>/domain/contexts/<context>/<subdomain>/<nested>.entity.ts`

String classes live in [nested.value-objects.md](nested.value-objects.md). Import them as `import * as ValueObjects from './<nested>.value-objects.ts'`. The entity has no `isNew`. Permission checks on setters are not written yet.

An entity that reads another level uses the same `root` as a value object. The aggregate passes `this`. A parent passes `this.root`. The entity reads `this.root.<field>`. An entity that only uses its own props does not declare `root`.

```ts
import { DomainEntity, type DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { <Context>Visa } from '../<context>.visa.ts';
import * as ValueObjects from './<nested>.value-objects.ts';

export interface <Nested>Props extends DomainEntityProps {
	<field>: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface <Nested>EntityReference extends Readonly<<Nested>Props> {}

export class <Nested> extends DomainEntity<<Nested>Props> implements <Nested>EntityReference {
	private readonly visa: <Context>Visa;
	constructor(props: <Nested>Props, visa: <Context>Visa) {
		super(props);
		this.visa = visa;
	}

	get <field>(): string {
		return this.props.<field>;
	}
	set <field>(<field>: string) {
		this.props.<field> = new ValueObjects.<Field>(<field>).valueOf();
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
```

A child entity uses `PropArray` and the same `.items.map` getter the aggregate uses. When the entity has nested value objects or entities, the reference `Omit`s those keys and redeclares them as the class or `ReadonlyArray`.

Append later with `getNewItem()`, then assign fields. Do not call `addItem` with a plain object.
