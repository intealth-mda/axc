import { isShapeNested, type Shape, type ShapeField, type ShapeNested } from '../../shape.ts';
import { gqlType } from '../../text.ts';

export function schema(input: { entityPascal: string; actionPascal: string; actionCamel: string; fieldName?: string; operation: string; shape: Shape; inputs?: ShapeField[]; byId?: boolean }): string {
	const { entityPascal, actionPascal, actionCamel, operation, shape, inputs } = input;
	const fieldName = input.fieldName ?? actionCamel;
	const byId = input.byId ? `extend type Query {\n\t${camelPascal(entityPascal)}ById(id: ID!): ${entityPascal}\n}\n\n` : '';
	const resultName = operation === 'Query' ? `${entityPascal}${actionPascal}Result` : `${entityPascal}MutationResult`;
	const resultHeading = operation === 'Query' ? `type ${resultName}` : `type ${resultName} implements MutationResult`;
	const resultFields = operation === 'Query' ? '\tid: ID!' : `\tstatus: MutationStatus!\n\t${camelPascal(entityPascal)}: ${entityPascal}`;
	if (inputs) {
		const lines = inputs.map((field) => `\t${field.name}: ${gqlFieldType(field)}`).join('\n');
		const typeName = operation === 'Query' ? 'Query' : 'Mutation';
		return `input ${entityPascal}${actionPascal}Input {\n${lines}\n}\n\n${resultHeading} {\n${resultFields}\n}\n\nextend type ${typeName} {\n\t${fieldName}(input: ${entityPascal}${actionPascal}Input!): ${resultName}!\n}\n`;
	}
	const nested = graphqlNestedBlocks(entityPascal, shape.nested);
	const prefix = nested.length > 0 ? `${nested}\n\n` : '';
	const documentFields = [
		'\tid: ID!',
		'\tschemaVersion: String!',
		'\tcreatedAt: DateTime!',
		'\tupdatedAt: DateTime!',
		...shape.fields.map((field) => `\t${field.name}: ${gqlFieldType(field)}`),
		...shape.nested.map((item) => `\t${item.camel}: ${gqlNestedType(entityPascal, item)}`),
	].join('\n');
	const inputFields = [
		...shape.fields.map((field) => `\t${field.name}: ${gqlFieldType(field)}`),
		...shape.nested.filter((item) => item.kind !== 'entity').map((item) => `\t${item.camel}: ${entityPascal}${item.pascal}Input!`),
	].join('\n');
	const typeName = operation === 'Query' ? 'Query' : 'Mutation';
	return `${prefix}type ${entityPascal} {\n${documentFields}\n}\n\ninput ${entityPascal}${actionPascal}Input {\n${inputFields}\n}\n\n${resultHeading} {\n${resultFields}\n}\n\n${byId}extend type ${typeName} {\n\t${fieldName}(input: ${entityPascal}${actionPascal}Input!): ${resultName}!\n}\n`;
}

/** Adds one field to the existing Query or Mutation block, plus its input type. */
export function insertGraphqlField(source: string, input: { entityPascal: string; actionPascal: string; fieldName: string; operation: 'Query' | 'Mutation'; inputs: { name: string; type: string }[] }): string {
	if (source.includes(`${input.fieldName}(`)) return source;
	const lines = input.inputs.map((field) => `\t${field.name}: ${gqlFieldType(field)}`).join('\n');
	const inputName = `${input.entityPascal}${input.actionPascal}Input`;
	const inputBlock = `input ${inputName} {\n${lines}\n}`;
	const resultName = input.operation === 'Query' ? `${input.entityPascal}${input.actionPascal}Result` : `${input.entityPascal}MutationResult`;
	const field = `\t${input.fieldName}(input: ${inputName}!): ${resultName}!`;
	const resultBlock =
		input.operation === 'Query'
			? `type ${resultName} {\n\tid: ID!\n}`
			: source.includes(`type ${resultName} `) || source.includes(`type ${resultName}\n`)
				? ''
				: `type ${resultName} implements MutationResult {\n\tstatus: MutationStatus!\n\t${camelPascal(input.entityPascal)}: ${input.entityPascal}\n}`;
	const header = `extend type ${input.operation} {`;
	let next = source;
	if (!next.includes(`input ${inputName} {`)) {
		const prelude = [inputBlock, resultBlock].filter((part) => part.length > 0).join('\n\n');
		const at = next.indexOf('extend type ');
		next = at < 0 ? `${next.trimEnd()}\n\n${prelude}\n` : `${next.slice(0, at)}${prelude}\n\n${next.slice(at)}`;
	}
	if (!next.includes(header)) return `${next.trimEnd()}\n\n${header}\n${field}\n}\n`;
	const open = next.indexOf(header) + header.length;
	const close = next.indexOf('\n}', open);
	if (close < 0) return source;
	next = `${next.slice(0, close)}\n${field}${next.slice(close)}`;
	return next.endsWith('\n') ? next : `${next}\n`;
}

function camelPascal(value: string): string {
	return value.charAt(0).toLowerCase() + value.slice(1);
}

function gqlNestedType(entityPascal: string, item: ShapeNested): string {
	const name = `${entityPascal}${item.pascal}`;
	return item.kind === 'entity' ? `[${name}!]!` : `${name}!`;
}

function gqlFieldType(field: { name: string; type: string }): string {
	if (field.name === 'id' || field.type === 'id') return 'ID!';
	return gqlType(field.type);
}

function graphqlNestedBlocks(entityPascal: string, items: ShapeNested[]): string {
	return items
		.flatMap((item) => {
			const outputFields = item.fields.map((member) => (isShapeNested(member) ? `\t${member.camel}: ${gqlNestedType(entityPascal, member)}` : `\t${member.name}: ${gqlFieldType(member)}`));
			const inputFields = item.fields.map((member) => (isShapeNested(member) ? `\t${member.camel}: ${entityPascal}${member.pascal}Input!` : `\t${member.name}: ${gqlFieldType(member)}`));
			const output = `type ${entityPascal}${item.pascal} {\n${outputFields.join('\n')}\n}`;
			const input = `input ${entityPascal}${item.pascal}Input {\n${inputFields.join('\n')}\n}`;
			return [graphqlNestedBlocks(entityPascal, item.fields.filter(isShapeNested)), output, input];
		})
		.filter((part) => part.length > 0)
		.join('\n\n');
}
