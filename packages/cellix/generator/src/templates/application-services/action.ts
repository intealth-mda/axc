import type { Shape, ShapeField, ShapeNested } from '../../shape.ts';
import { type ActionKind, commandFields, namespacePath } from '../../text.ts';

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
	const owned = shape.nested.filter((item) => item.kind !== 'entity');
	const inputLiteral = [...shape.fields.map((field) => `${field.name}: command.${field.name}`), ...owned.map((item) => `${item.camel}: command.${item.camel}`)].join(', ');
	const domainPath = namespacePath(contextPascal, entityPascal);
	const reference = `Domain.Contexts.${domainPath}EntityReference`;
	const transaction = `dataSources.domainDataSource.${domainPath}UnitOfWork.withScopedTransaction`;
	const caught = (inner: string) =>
		`try {\n\t\t\t${inner}\n\t\t} catch (error) {\n\t\t\tif (typeof error === 'object' && error !== null && 'status' in error) throw error;\n\t\t\tthrow Object.assign(error instanceof Error ? error : new Error('Unable to save ${entityPascal}'), { status: 400 });\n\t\t}`;
	const missing = `throw Object.assign(new Error('Unable to update ${entityPascal}'), { status: 404 });`;
	const body =
		kind === 'read'
			? `return await dataSources.readonlyDataSource.${contextPascal}.${entityPascal}.${entityPascal}ReadRepo.${actionCamel}(command);`
			: kind === 'update'
				? caught(
						`let updated: ${reference} | undefined;\n\t\t\tawait ${transaction}(async (repo) => {\n\t\t\t\tconst current = await repo.getById(command.id);\n\t\t\t\tif (!current) {\n\t\t\t\t\t${missing}\n\t\t\t\t}\n\t\t\t\t// assign the command onto current. A rejected change throws Object.assign(new Error('...'), { status: 409 })\n\t\t\t\tupdated = await repo.save(current);\n\t\t\t});\n\t\t\tif (!updated) {\n\t\t\t\t${missing}\n\t\t\t}\n\t\t\treturn updated;`,
					)
				: caught(
						`// Another aggregate is dataSources.readonlyDataSource.<Context>.<Entity>.<Entity>ReadRepo.getById(id). This slice's query names a duplicate.\n\t\t\treturn await ${transaction}(async (repo) => {\n\t\t\t\treturn repo.save(await repo.getNewInstance({ ${inputLiteral} }));\n\t\t\t});`,
					);
	return `import type { Domain } from '${scope}/domain';\nimport type { DataSources } from '${scope}/persistence';\n\nexport interface ${command} {\n\t${commandFields(commandSource, kind)}\n}\n\nexport const ${actionCamel} = (dataSources: DataSources) => {\n\treturn async (command: ${command}): Promise<${result}> => {\n\t\t${body}\n\t};\n};\n`;
}

/** An application service with no action yet. `query` and `update` add functions to it. */
export function entityServiceShell(entityPascal: string, scope: string): string {
	return `import type { DataSources } from '${scope}/persistence';\n\nexport interface ${entityPascal}ApplicationService {\n}\n\nexport const ${entityPascal} = (_dataSources: DataSources): ${entityPascal}ApplicationService => {\n\treturn {\n\t};\n};\n`;
}

export function entityServiceIndex(action: string, actionCamel: string, command: string, _contextPascal: string, entityPascal: string, result: string, scope: string): string {
	return `import type { Domain } from '${scope}/domain';\nimport type { DataSources } from '${scope}/persistence';\nimport { type ${command}, ${actionCamel} } from './${action}.ts';\n\nexport interface ${entityPascal}ApplicationService {\n\t${actionCamel}: (command: ${command}) => Promise<${result}>;\n}\n\nexport const ${entityPascal} = (dataSources: DataSources): ${entityPascal}ApplicationService => {\n\treturn {\n\t\t${actionCamel}: ${actionCamel}(dataSources),\n\t};\n};\n`;
}
