import type { Shape, ShapeField, ShapeNested } from '../../shape.ts';
import { type ActionKind, commandFields, creationFields, namespacePath, readArgumentList } from '../../text.ts';

export function action(input: {
	actionCamel: string;
	command: string;
	contextPascal: string;
	entityPascal: string;
	kind: ActionKind;
	result: string;
	scope: string;
	shape: Shape;
	commandShape?: { fields: ShapeField[]; nested: ShapeNested[] };
}): string {
	const { actionCamel, command, contextPascal, entityPascal, kind, result, scope, shape } = input;
	const commandSource = input.commandShape ?? shape;
	const createdArguments = creationFields(shape)
		.map((field) => `command.${field.name}`)
		.join(', ');
	const domainPath = namespacePath(contextPascal, entityPascal);
	const reference = `Domain.Contexts.${domainPath}EntityReference`;
	const transaction = `dataSources.domainDataSource.${domainPath}UnitOfWork.withScopedTransaction`;
	const caught = (inner: string) =>
		`try {\n\t\t\t${inner}\n\t\t} catch (error) {\n\t\t\tlet failure: unknown = error;\n\t\t\tfor (let depth = 0; depth < 5 && typeof failure === 'object' && failure !== null; depth += 1) {\n\t\t\t\tif ('status' in failure) throw failure;\n\t\t\t\tfailure = 'cause' in failure ? failure.cause : undefined;\n\t\t\t}\n\t\t\tthrow Object.assign(error instanceof Error ? error : new Error('Unable to save ${entityPascal}'), { status: 400 });\n\t\t}`;
	const missing = `throw Object.assign(new Error('Unable to update ${entityPascal}'), { status: 404 });`;
	const body =
		kind === 'read'
			? `return await dataSources.readonlyDataSource.${contextPascal}.${entityPascal}.${entityPascal}ReadRepo.${actionCamel}(${readArgumentList(commandFields(commandSource, 'read').replaceAll('\n\t', ' '))});`
			: kind === 'update'
				? caught(
						`let updated: ${reference} | undefined;\n\t\t\tawait ${transaction}(async (repo) => {\n\t\t\t\tconst current = await repo.getById(command.id);\n\t\t\t\tif (!current) {\n\t\t\t\t\t${missing}\n\t\t\t\t}\n\t\t\t\t// assign the command onto current. A rejected change throws Object.assign(new Error('...'), { status: 409 })\n\t\t\t\tupdated = await repo.save(current);\n\t\t\t});\n\t\t\tif (!updated) {\n\t\t\t\t${missing}\n\t\t\t}\n\t\t\treturn updated;`,
					)
				: kind === 'create'
					? caught(
							`// Another aggregate is dataSources.readonlyDataSource.<Context>.<Entity>.<Entity>ReadRepo.getById(id). It finds the seed _id. This slice's query names a duplicate.\n\t\t\tlet created: ${reference} | undefined;\n\t\t\tawait ${transaction}(async (repo) => {\n\t\t\t\tcreated = await repo.save(await repo.getNewInstance(${createdArguments}));\n\t\t\t});\n\t\t\tif (!created) {\n\t\t\t\tthrow Object.assign(new Error('Unable to save ${entityPascal}'), { status: 400 });\n\t\t\t}\n\t\t\treturn created;`,
						)
					: caught(`return await ${transaction}(async (repo) => {\n\t\t\t\treturn repo.save(await repo.getNewInstance(${createdArguments}));\n\t\t\t});`);
	return `import type { Domain } from '${scope}/domain';\nimport type { DataSources } from '${scope}/persistence';\n\nexport interface ${command} {\n\t${commandFields(commandSource, kind)}\n}\n\nexport const ${actionCamel} = (dataSources: DataSources) => {\n\treturn async (command: ${command}): Promise<${result}> => {\n\t\t${body}\n\t};\n};\n`;
}

/** The default read. GraphQL exposes it as `${entity}ById`. */
export function queryByIdAction(entityPascal: string, contextPascal: string, scope: string): string {
	const command = `${entityPascal}QueryByIdCommand`;
	const reference = `Domain.Contexts.${namespacePath(contextPascal, entityPascal)}EntityReference`;
	return `import type { Domain } from '${scope}/domain';\nimport type { DataSources } from '${scope}/persistence';\n\nexport interface ${command} {\n\tid: string;\n}\n\nexport const queryById = (dataSources: DataSources) => {\n\treturn async (command: ${command}): Promise<${reference} | null> => {\n\t\treturn await dataSources.readonlyDataSource.${contextPascal}.${entityPascal}.${entityPascal}ReadRepo.getById(command.id);\n\t};\n};\n`;
}

/** An application service with the default get-by-id query. `query` and `mutation` add functions to it. */
export function entityServiceShell(entityPascal: string, contextPascal: string, scope: string): string {
	const command = `${entityPascal}QueryByIdCommand`;
	const reference = `Domain.Contexts.${namespacePath(contextPascal, entityPascal)}EntityReference`;
	return `import type { Domain } from '${scope}/domain';\nimport type { DataSources } from '${scope}/persistence';\nimport { type ${command}, queryById } from './query-by-id.ts';\n\nexport interface ${entityPascal}ApplicationService {\n\tqueryById: (command: ${command}) => Promise<${reference} | null>;\n}\n\nexport const ${entityPascal} = (dataSources: DataSources): ${entityPascal}ApplicationService => {\n\treturn {\n\t\tqueryById: queryById(dataSources),\n\t};\n};\n`;
}

export function entityServiceIndex(action: string, actionCamel: string, command: string, contextPascal: string, entityPascal: string, result: string, scope: string): string {
	const reference = `Domain.Contexts.${namespacePath(contextPascal, entityPascal)}EntityReference`;
	const ownById = actionCamel === 'queryById';
	const byIdImport = ownById ? '' : `import { type ${entityPascal}QueryByIdCommand, queryById } from './query-by-id.ts';\n`;
	const byIdMember = ownById ? '' : `\n\tqueryById: (command: ${entityPascal}QueryByIdCommand) => Promise<${reference} | null>;`;
	const byIdReturn = ownById ? '' : `\n\t\tqueryById: queryById(dataSources),`;
	return `import type { Domain } from '${scope}/domain';\nimport type { DataSources } from '${scope}/persistence';\nimport { type ${command}, ${actionCamel} } from './${action}.ts';\n${byIdImport}\nexport interface ${entityPascal}ApplicationService {\n\t${actionCamel}: (command: ${command}) => Promise<${result}>;${byIdMember}\n}\n\nexport const ${entityPascal} = (dataSources: DataSources): ${entityPascal}ApplicationService => {\n\treturn {\n\t\t${actionCamel}: ${actionCamel}(dataSources),${byIdReturn}\n\t};\n};\n`;
}
