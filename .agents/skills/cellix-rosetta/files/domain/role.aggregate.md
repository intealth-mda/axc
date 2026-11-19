# Role aggregate

Path: `<domain>/domain/contexts/<context>/<subdomain>/<subdomain>.ts`

A subdomain named `role`, or whose kebab name ends in `-role`, is a role. `dock-role` under context `harbor` is one. An ordinary aggregate follows [subdomain.aggregate.md](subdomain.aggregate.md). A role does not.

The sheet role matrix is not this aggregate. Those letters stay on the sheet.

The aggregate file may be `<subdomain>.ts`. `<subdomain>.aggregate.ts` is also accepted. Permission groups are `<subdomain>-<group>-permissions.ts`. `schemaVersion` and `<subdomain>.value-objects.ts` are not required yet. A name with a length or a pattern is an empty `VOString`. A plain string is not a class. A closed set of role kinds extends `VOSet`.

A role keeps `isNew`. It does not have `markAsNew`. `getNewInstance` sets `isNew` to true, assigns `roleName` and `isDefault` through the setters, then sets `isNew` to false. It does not assign `this.props`.

`getDefaultRoleNames` returns the canonical default names. Each built-in role has its own `getNewDefault<Kind>Instance(newProps, passport)`. That method sets `isNew` to true, assigns the name, the kind, `isDefault`, and the permission flags through setters, then sets `isNew` to false.

`deleteAndReassignTo(roleRef)` refuses a default role, sets `isDeleted`, and adds an integration event that carries the deleted id and the id that receives the assignments.

Updates go through setters: `roleName`, `isDefault`, and the kind. Do not add `updateRoleName`, `create`, or `validateManagePermission`. Permission checks on setters are not written yet.

## Permissions

The sheet does not supply these flags yet. Map them the way a subdomain is mapped onto its files: one known file per piece, opened from this page. Do not invent a group, and do not read a permission out of a column.

For this role, write `<subdomain>-permissions.ts`, then one `<subdomain>-<group>-permissions.ts` per group. A group is one context whose domain permissions this role stores. `dock-role` storing berth grants is the group `berth`, file `dock-role-berth-permissions.ts`.

A group that stores a context's domain permissions extends `Omit` of that interface. Drop `isSystemAccount` and every `isEditingOwn<Thing>`. Those stay on the visa. Drop any other flag this role does not store. A group whose flags are not that interface declares a spec of the booleans, then the props extend the spec. Every boolean on the props has a getter and a setter. The setter assigns `this.props.<flag>`. The visa check on that setter is not written yet. The constructor still takes the visa and stores it.

`<subdomain>-permissions.ts` lists each group as a readonly prop. Its entity reference replaces each group props type with that group's entity reference. Each getter builds the group and passes the visa. A missing group is an object where every flag is `false`.

The aggregate props hold `readonly permissions: <Subdomain>PermissionsProps`. The entity reference omits `permissions` and uses `<Subdomain>PermissionsEntityReference`. The getter is `new <Subdomain>Permissions(this.props.permissions, this.visa)`.

A built-in role sets flags through those setters: `role.permissions.<group>Permissions.<flag> = true` or `false`. Set every flag the group stores.

```ts
export interface <Subdomain><Group>PermissionsProps extends Omit<<Context>DomainPermissions, 'isSystemAccount' | 'isEditingOwn<Thing>'>, ValueObjectProps {}
export interface <Subdomain><Group>PermissionsEntityReference extends Readonly<<Subdomain><Group>PermissionsProps> {}

export class <Subdomain><Group>Permissions extends ValueObject<<Subdomain><Group>PermissionsProps> implements <Subdomain><Group>PermissionsEntityReference {
	private readonly visa: <Context>Visa;
	constructor(props: <Subdomain><Group>PermissionsProps, visa: <Context>Visa) {
		super(props);
		this.visa = visa;
	}

	get <flag>(): boolean {
		return this.props.<flag>;
	}
	set <flag>(value: boolean) {
		this.props.<flag> = value;
	}
}
```

When the flags are not an existing domain permissions interface, the props extend a spec instead of `Omit`:

```ts
interface <Subdomain><Group>PermissionsSpec {
	<flag>: boolean;
}
export interface <Subdomain><Group>PermissionsProps extends <Subdomain><Group>PermissionsSpec, ValueObjectProps {}
```

```ts
export interface <Subdomain>PermissionsProps extends ValueObjectProps {
	readonly <group>Permissions: <Subdomain><Group>PermissionsProps;
}

export interface <Subdomain>PermissionsEntityReference extends Readonly<Omit<<Subdomain>PermissionsProps, '<group>Permissions'>> {
	readonly <group>Permissions: <Subdomain><Group>PermissionsEntityReference;
}

export class <Subdomain>Permissions extends ValueObject<<Subdomain>PermissionsProps> implements <Subdomain>PermissionsEntityReference {
	private readonly visa: <Context>Visa;
	constructor(props: <Subdomain>PermissionsProps, visa: <Context>Visa) {
		super(props);
		this.visa = visa;
	}

	get <group>Permissions(): <Subdomain><Group>Permissions {
		return new <Subdomain><Group>Permissions(this.props.<group>Permissions ?? { <flag>: false }, this.visa);
	}
}
```

```ts
public static getNewInstance<props extends <Subdomain>Props>(newProps: props, passport: Passport, roleName: string, isDefault: boolean): <Subdomain><props> {
	const role = new <Subdomain>(newProps, passport);
	role.isNew = true;
	role.roleName = roleName;
	role.isDefault = isDefault;
	role.isNew = false;
	return role;
}

public static getDefaultRoleNames(): string[] {
	return ['Dock.Pilot', 'Dock.HarborMaster'];
}

public static getNewDefaultPilotInstance<props extends <Subdomain>Props>(newProps: props, passport: Passport): <Subdomain><props> {
	const role = new <Subdomain>(newProps, passport);
	role.isNew = true;
	role.roleName = 'Dock Pilot';
	role.kind = <Subdomain>ValueObjects.KindNames.Pilot;
	role.isDefault = true;
	role.permissions.berthPermissions.canAssignBerth = true;
	role.permissions.berthPermissions.canCloseBerth = false;
	role.isNew = false;
	return role;
}

public deleteAndReassignTo(roleRef: <Subdomain>EntityReference): void {
	if (this.isDefault) {
		throw new Error('A default role cannot be deleted');
	}
	super.isDeleted = true;
	this.addIntegrationEvent(RoleDeletedReassignEvent, { deletedRoleId: this.props.id, newRoleId: roleRef.id });
}

get permissions(): <Subdomain>Permissions {
	return new <Subdomain>Permissions(this.props.permissions, this.visa);
}
```

`Dock.Pilot` and `canAssignBerth` are the shape of a default, not a name from this repo. Copy the defaults the product already has. Do not invent a default the folder does not already list.
