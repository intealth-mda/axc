import { isShapeNested, type ShapeField, type ShapeNested } from '../../shape.ts';
import { tsType } from '../../text.ts';

function setterGuard(permission: string, name: string): string {
	return `if (!this.isNew && !this.visa.determineIf((permissions) => permissions.${permission})) {\n\t\t\tthrow new PermissionError('You do not have permission to change ${name}');\n\t\t}`;
}

export function scalarMembers(field: ShapeField, permission: string): string {
	const assign = field.type === 'string' ? `this.props.${field.name} = new ValueObjects.${field.pascal}(${field.name}).valueOf();` : `this.props.${field.name} = ${field.name};`;
	return `\tget ${field.name}(): ${tsType(field.type)} {\n\t\treturn this.props.${field.name};\n\t}\n\tset ${field.name}(${field.name}: ${tsType(field.type)}) {\n\t\t${setterGuard(permission, field.name)}\n\t\t${assign}\n\t}`;
}

export function nestedMembers(item: ShapeNested): string {
	if (item.kind === 'entity') {
		return `\tget ${item.camel}(): ReadonlyArray<${item.pascal}EntityReference> {\n\t\treturn this.props.${item.camel}.items.map((entry) => new ${item.pascal}(entry, this.visa));\n\t}`;
	}
	return `\tget ${item.camel}(): ${item.pascal} {\n\t\treturn new ${item.pascal}(this.props.${item.camel});\n\t}`;
}

export function createdMembers(): string {
	return `\tget createdAt(): Date {\n\t\treturn this.props.createdAt;\n\t}\n\tget updatedAt(): Date {\n\t\treturn this.props.updatedAt;\n\t}\n\tget schemaVersion(): string {\n\t\treturn this.props.schemaVersion;\n\t}`;
}

export function entityReference(entityPascal: string, nests: ShapeNested[]): string {
	const keys = nests.map((item) => `'${item.camel}'`).join(' | ');
	const lines = nests.map((item) => (item.kind === 'entity' ? `\treadonly ${item.camel}: ReadonlyArray<${item.pascal}EntityReference>;` : `\treadonly ${item.camel}: ${item.pascal};`)).join('\n');
	return `export interface ${entityPascal}EntityReference extends Readonly<Omit<${entityPascal}Props, ${keys}>> {\n${lines}\n}`;
}

export function childImport(item: ShapeNested): string {
	if (item.kind === 'entity') return `import { ${item.pascal}, type ${item.pascal}EntityReference, type ${item.pascal}Props } from './${item.name}.entity.ts';`;
	return `import { ${item.pascal}, type ${item.pascal}Props } from './${item.name}.value-objects.ts';`;
}

export function valueObjectImport(item: ShapeNested): string {
	const hasString = item.fields.some((member) => !isShapeNested(member) && member.type === 'string');
	return hasString ? `import * as ValueObjects from './${item.name}.value-objects.ts';` : '';
}
