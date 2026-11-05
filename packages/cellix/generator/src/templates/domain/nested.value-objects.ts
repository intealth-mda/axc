import { isShapeNested, type ShapeField, type ShapeNested } from '../../shape.ts';
import { propLines, tsType } from '../../text.ts';

/** An entity keeps only its string classes here. A nested object without an id is a value-object class. */
export function nestedValueObject(item: ShapeNested, names: string[]): string {
	const strings = names.map((name) => `export class ${name} extends VOString({\n\ttrim: true,\n\tminLength: 1,\n\tmaxLength: 200,\n}) {}`).join('\n');
	if (item.kind !== 'value') return `import { VOString } from '@lucaspaganini/value-objects';\n\n${strings}\n`;
	const childImports = item.fields
		.filter(isShapeNested)
		.map((child) => `import { ${child.pascal}, type ${child.pascal}Props } from './${child.name}.${child.kind === 'entity' ? 'entity' : 'value-objects'}.ts';`)
		.join('\n');
	const imports = [
		names.length > 0 ? "import { VOString } from '@lucaspaganini/value-objects';" : '',
		"import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';",
		"import { ValueObject } from '@cellix/domain-seedwork/value-object';",
		childImports,
	]
		.filter((line) => line.length > 0)
		.join('\n');
	const members = item.fields.map((member) => (isShapeNested(member) ? objectMember(member) : scalarMember(member))).join('\n\n');
	const stringBlock = strings.length > 0 ? `${strings}\n\n` : '';
	return `${imports}\n\n${stringBlock}export interface ${item.pascal}Props extends ValueObjectProps {\n${propLines(item.fields)}\n}\n\nexport class ${item.pascal} extends ValueObject<${item.pascal}Props> {\n${members}\n}\n`;
}

function scalarMember(field: ShapeField): string {
	const assign = field.type === 'string' ? `this.props.${field.name} = new ${field.pascal}(${field.name}).valueOf();` : `this.props.${field.name} = ${field.name};`;
	return `\tget ${field.name}(): ${tsType(field.type)} {\n\t\treturn this.props.${field.name};\n\t}\n\tset ${field.name}(${field.name}: ${tsType(field.type)}) {\n\t\t${assign}\n\t}`;
}

function objectMember(item: ShapeNested): string {
	return `\tget ${item.camel}(): ${item.pascal} {\n\t\treturn new ${item.pascal}(this.props.${item.camel});\n\t}`;
}
