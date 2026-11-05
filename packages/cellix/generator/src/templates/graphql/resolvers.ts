import { camel } from '../../names.ts';
import type { Shape } from '../../shape.ts';
import { creationFields } from '../../text.ts';

export function resolvers(input: {
	entity: string;
	entityPascal: string;
	contextPascal: string;
	actionCamel: string;
	actionPascal: string;
	operation: string;
	fieldName?: string;
	scope: string;
	shape: Shape;
	graphqlLayer: string;
	fields?: string[];
	byId?: boolean;
}): string {
	const { entity, entityPascal, contextPascal, actionCamel, actionPascal, operation, scope, shape, graphqlLayer } = input;
	const fieldName = input.fieldName ?? actionCamel;
	const schemaTypes = graphqlLayer.endsWith('schema/types');
	const contextFrom = schemaTypes ? '../context.ts' : './context.ts';
	const contextType = schemaTypes ? `${entityPascal}Context` : 'GraphContext';
	const inputType = `${entityPascal}${actionPascal}Input`;
	const servicesImport = schemaTypes ? `import type { ApplicationServices } from '${scope}/application-services';\n` : '';
	const generatedImport = schemaTypes
		? `import type { ${inputType}, Resolvers } from '../builder/generated.ts';\nimport type { GraphContext } from '${contextFrom}';\n`
		: `import type { GraphContext, Resolvers } from '${contextFrom}';\n`;
	const domainImport = operation === 'Mutation' ? `import type { Domain } from '${scope}/domain';\n` : '';
	const contextAlias = schemaTypes ? `\ntype ${contextType} = GraphContext<ApplicationServices>;\n` : '';
	const helper = operation === 'Mutation' ? `\n${mutationResolverHelper(entityPascal, contextPascal)}\n` : '';
	const field =
		operation === 'Mutation'
			? mutationField({ entityPascal, contextPascal, actionCamel, fieldName, inputType, contextType, fields: input.fields ?? creationFields(shape).map((field) => field.name) })
			: queryField(contextPascal, entityPascal, actionCamel, fieldName, contextType);
	const byIdField = input.byId ? `\tQuery: {\n${byIdQueryField(entity, contextPascal, entityPascal, contextType)}\t},\n` : '';
	const operationField = `\t${operation}: {\n${field}\t},\n`;
	const resolversType = schemaTypes ? `Resolvers<${contextType}>` : 'Resolvers';
	return `${domainImport}${servicesImport}${generatedImport}${contextAlias}${helper}const ${camel(entity)}Resolvers: ${resolversType} = {\n${byIdField}${operationField}};\n\nexport default ${camel(entity)}Resolvers;\n`;
}

function byIdQueryField(entity: string, contextPascal: string, entityPascal: string, contextType: string): string {
	return `\t\t${camel(entity)}ById: async (_parent, args: { id: string }, context: ${contextType}) => {\n\t\t\treturn await context.applicationServices.${contextPascal}.${entityPascal}.queryById({ id: args.id });\n\t\t},\n`;
}

export function mutationResolverHelper(entityPascal: string, contextPascal: string): string {
	const payload = entityPascal.charAt(0).toLowerCase() + entityPascal.slice(1);
	return `const ${entityPascal}MutationResolver = async (get${entityPascal}: Promise<Domain.Contexts.${contextPascal}.${entityPascal}.${entityPascal}EntityReference>) => {\n\ttry {\n\t\treturn {\n\t\t\tstatus: { success: true },\n\t\t\t${payload}: await get${entityPascal},\n\t\t};\n\t} catch (error) {\n\t\tconsole.error('${entityPascal} > Mutation  : ', error);\n\t\tconst { message } = error as Error;\n\t\treturn {\n\t\t\tstatus: { success: false, errorMessage: message },\n\t\t};\n\t}\n};`;
}

export function mutationField(input: { entityPascal: string; contextPascal: string; actionCamel: string; fieldName: string; inputType: string; contextType: string; fields: string[] }): string {
	const lines = input.fields.map((name) => `${name}: args.input.${name}`).join(',\n\t\t\t\t');
	const argument = lines.length > 0 ? `{\n\t\t\t\t${lines},\n\t\t\t}` : '{}';
	return `\t\t${input.fieldName}: async (_parent, args: { input: ${input.inputType} }, context: ${input.contextType}) => {\n\t\t\treturn await ${input.entityPascal}MutationResolver(context.applicationServices.${input.contextPascal}.${input.entityPascal}.${input.actionCamel}(${argument}));\n\t\t},\n`;
}

function queryField(contextPascal: string, entityPascal: string, actionCamel: string, fieldName: string, contextType: string): string {
	return `\t\t${fieldName}: async (_parent, args, context: ${contextType}) => {\n\t\t\treturn await context.applicationServices.${contextPascal}.${entityPascal}.${actionCamel}(args.input);\n\t\t},\n`;
}
