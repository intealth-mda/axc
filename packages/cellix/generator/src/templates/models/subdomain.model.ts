import { isShapeNested, type Shape, type ShapeNested } from '../../shape.ts';
import { mongooseField, tsType } from '../../text.ts';

export function model(entityPascal: string, shape: Shape): string {
	const nestedTypes = modelInterfaces(entityPascal, shape.nested);
	const schemas = nestedSchemaConsts(entityPascal, shape.nested);
	const fields = [...shape.fields.map((field) => `\t${field.name}: ${tsType(field.type)};`), ...shape.nested.map((item) => `\t${modelField(entityPascal, item)};`)].join('\n');
	const schemaFields = [...shape.fields.map((field) => `\t\t${field.name}: ${mongooseField(field)},`), ...shape.nested.map((item) => modelSchemaField(entityPascal, item))].join('\n');
	const mongooseImport = containsEntity(shape.nested) ? "import { type Model, Schema, Types } from 'mongoose';" : "import { type Model, Schema } from 'mongoose';";
	const schemaBlock = schemas.length > 0 ? `${schemas}\n\n` : '';
	return `import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
${mongooseImport}

${nestedTypes}${schemaBlock}export interface ${entityPascal} extends MongooseSeedwork.Base {
${fields}
}

const ${entityPascal}Schema = new Schema<${entityPascal}, Model<${entityPascal}>, ${entityPascal}>(
	{
		schemaVersion: { type: String, default: '1.0.0' },
${schemaFields}
	},
	{ timestamps: true, versionKey: 'version' },
);

export const ${entityPascal}ModelName = '${entityPascal}';
export const ${entityPascal}ModelFactory = MongooseSeedwork.modelFactory<${entityPascal}>(${entityPascal}ModelName, ${entityPascal}Schema);
export type ${entityPascal}ModelType = ReturnType<typeof ${entityPascal}ModelFactory>;
`;
}

export function modelField(prefix: string, item: ShapeNested): string {
	return item.kind === 'entity' ? `${item.camel}: Types.DocumentArray<${prefix}${item.pascal}>` : `${item.camel}: ${prefix}${item.pascal}`;
}

export function modelSchemaField(prefix: string, item: ShapeNested): string {
	const schema = `${prefix}${item.pascal}Schema`;
	return item.kind === 'entity' ? `\t\t${item.camel}: [${schema}],` : `\t\t${item.camel}: ${schema},`;
}

export function nestedSchemaConsts(prefix: string, items: ShapeNested[]): string {
	const chunks: string[] = [];
	const walk = (list: ShapeNested[]) => {
		for (const item of list) {
			walk(item.fields.filter(isShapeNested));
			const options = item.kind === 'entity' ? "{ timestamps: true, versionKey: 'version' }" : "{ _id: false, timestamps: true, versionKey: 'version' }";
			chunks.push(`const ${prefix}${item.pascal}Schema = new Schema(\n\t{\n${mongooseMembers(item, '\t', prefix)}\n\t},\n\t${options},\n);`);
		}
	};
	walk(items);
	return chunks.join('\n\n');
}

export function modelInterfaces(prefix: string, items: ShapeNested[]): string {
	const text = items
		.flatMap((item) => {
			const lines = item.fields.map((member) => {
				if (!isShapeNested(member)) return `\t${member.name}: ${tsType(member.type)};`;
				return `\t${modelField(prefix, member)};`;
			});
			const base = item.kind === 'entity' ? ' extends MongooseSeedwork.SubdocumentBase' : '';
			const self = `export interface ${prefix}${item.pascal}${base} {\n${lines.join('\n')}\n}`;
			return [modelInterfaces(prefix, item.fields.filter(isShapeNested)), self];
		})
		.filter((part) => part.length > 0)
		.join('\n\n');
	return text.length > 0 ? `${text}\n` : '';
}

function mongooseMembers(item: ShapeNested, indent: string, prefix = ''): string {
	return item.fields
		.map((member) => {
			if (isShapeNested(member)) {
				const schema = `${prefix}${member.pascal}Schema`;
				return member.kind === 'entity' ? `${indent}\t${member.camel}: [${schema}],` : `${indent}\t${member.camel}: ${schema},`;
			}
			return `${indent}\t${member.name}: ${mongooseField(member)},`;
		})
		.join('\n');
}

function containsEntity(items: ShapeNested[]): boolean {
	return items.some((item) => item.kind === 'entity' || containsEntity(item.fields.filter(isShapeNested)));
}
