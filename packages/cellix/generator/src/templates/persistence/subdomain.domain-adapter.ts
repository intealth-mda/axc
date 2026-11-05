import { isShapeNested, type Shape, type ShapeField, type ShapeNested } from '../../shape.ts';
import { structuralType, tsType } from '../../text.ts';

export function domainAdapter(input: { entityPascal: string; contextPascal: string; scope: string; shape: Shape }): string {
	const { entityPascal, contextPascal, scope, shape } = input;
	const classPath = `${contextPascal}.${entityPascal}.${entityPascal}`;
	const propsRoot = `Domain.Contexts.${contextPascal}.${entityPascal}`;
	const collections = shape.nested.filter((item) => item.kind === 'entity').map((item) => entityCollection(item, entityPascal, propsRoot));
	const docTypes = [entityPascal, ...collections.flatMap((item) => item.docTypes)];
	const members = [
		...shape.fields.map((field) => scalarAdapter(field.name, tsType(field.type))),
		...shape.nested.filter((item) => item.kind !== 'entity').map((item) => scalarAdapter(item.camel, structuralType(item))),
		...collections.map((item) => item.getter),
	].join('\n');
	const propArrayImport = collections.length > 0 ? "import type { PropArray } from '@cellix/domain-seedwork/prop-array';\n" : '';
	const classes = collections.map((item) => item.classText).join('\n\n');
	const tail = classes.length > 0 ? `\n${classes}\n` : '';
	return `${propArrayImport}import type { ${docTypes.join(', ')} } from '${scope}/data-sources-mongoose-models';
import { Domain } from '${scope}/domain';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

export class ${entityPascal}Converter extends MongooseSeedwork.MongoTypeConverter<${entityPascal}, ${entityPascal}DomainAdapter, Domain.Passport, Domain.Contexts.${classPath}<${entityPascal}DomainAdapter>> {
	constructor() {
		super(${entityPascal}DomainAdapter, Domain.Contexts.${classPath});
	}
}

export class ${entityPascal}DomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<${entityPascal}> implements Domain.Contexts.${classPath}Props {
${members}
}
${tail}`;
}

export function entityCollection(item: ShapeNested, entityPascal: string, propsRoot: string): { getter: string; classText: string; docTypes: string[] } {
	const docType = `${entityPascal}${item.pascal}`;
	const className = `${item.pascal}DomainAdapter`;
	const propsType = `${propsRoot}.${item.pascal}Props`;
	const children = item.fields.filter((member): member is ShapeNested => isShapeNested(member) && member.kind === 'entity');
	const childParts = children.map((child) => entityCollection(child, entityPascal, propsRoot));
	const members = [
		`get id(): string {\n\t\treturn this.doc.id?.valueOf() as string;\n\t}`,
		`get createdAt(): Date {\n\t\treturn this.doc.createdAt as Date;\n\t}`,
		`get updatedAt(): Date {\n\t\treturn this.doc.updatedAt as Date;\n\t}`,
		...item.fields.flatMap((member) => childMembers(member, propsRoot)),
		...childParts.map((child) => child.getter),
	];
	const classText = [
		...childParts.map((child) => child.classText),
		`class ${className} implements ${propsType} {\n\tpublic readonly doc: ${docType};\n\tconstructor(doc: ${docType}) {\n\t\tthis.doc = doc;\n\t}\n\n\t${members.join('\n\t')}\n}`,
	].join('\n\n');
	const getter = `get ${item.camel}(): PropArray<${propsType}> {\n\t\treturn new MongooseSeedwork.MongoosePropArray(this.doc.${item.camel}, ${className});\n\t}`;
	return { getter: `\t${getter.replaceAll('\n', '\n\t')}`, classText, docTypes: [docType, ...childParts.flatMap((child) => child.docTypes)] };
}

function childMembers(member: ShapeField | ShapeNested, propsRoot: string): string[] {
	if (isShapeNested(member)) {
		if (member.kind === 'entity') return [];
		return [scalarAdapter(member.camel, `${propsRoot}.${member.pascal}Props`).trim()];
	}
	return [scalarAdapter(member.name, tsType(member.type)).trim()];
}

function scalarAdapter(name: string, type: string): string {
	return `\tget ${name}(): ${type} {\n\t\treturn this.doc.${name};\n\t}\n\tset ${name}(${name}: ${type}) {\n\t\tthis.doc.${name} = ${name};\n\t}`;
}
