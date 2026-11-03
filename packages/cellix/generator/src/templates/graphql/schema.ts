import { isShapeNested, type Shape, type ShapeField, type ShapeNested } from '../../shape.ts';
import { gqlType } from '../../text.ts';

export function schema(input: { entityPascal: string; actionPascal: string; actionCamel: string; fieldName?: string; operation: string; shape: Shape; inputs?: ShapeField[] }): string {
	const { entityPascal, actionPascal, actionCamel, operation, shape, inputs } = input;
	const fieldName = input.fieldName ?? actionCamel;
	const resultName = operation === 'Query' ? `${entityPascal}${actionPascal}Result` : `${entityPascal}${actionPascal}MutationResult`;
	if (inputs) {
		const lines = inputs.map((field) => `\t${field.name}: ${gqlFieldType(field)}`).join('\n');
		const typeName = operation === 'Query' ? 'Query' : 'Mutation';
		const resultFields = operation === 'Query' ? '\tid: ID!' : '\tstatus: MutationStatus!';
		return `input ${entityPascal}${actionPascal}Input {\n${lines}\n}\n\ntype ${resultName} {\n${resultFields}\n}\n\nextend type ${typeName} {\n\t${fieldName}(input: ${entityPascal}${actionPascal}Input!): ${resultName}!\n}\n`;
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
	const resultFields = operation === 'Query' ? '\tid: ID!' : '\tstatus: MutationStatus!';
	return `${prefix}type ${entityPascal} {\n${documentFields}\n}\n\ninput ${entityPascal}${actionPascal}Input {\n${inputFields}\n}\n\ntype ${resultName} {\n${resultFields}\n}\n\nextend type ${typeName} {\n\t${fieldName}(input: ${entityPascal}${actionPascal}Input!): ${resultName}!\n}\n`;
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
