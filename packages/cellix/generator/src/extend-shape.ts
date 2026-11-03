import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { camel, pascal } from './names.ts';
import { extendMembers, isShapeNested, type ShapeField, type ShapeNested } from './shape.ts';
import { type FieldSpec, mergeFields, type NestedSpec } from './spec.ts';
import { childImport, entityReference, nestedMembers, scalarMembers } from './templates/domain/members.ts';
import { nestedEntity } from './templates/domain/nested.entity.ts';
import { nestedValueObject } from './templates/domain/nested.value-objects.ts';
import { modelField, modelInterfaces, modelSchemaField, nestedSchemaConsts } from './templates/models/entity.model.ts';
import { seedNested, seedScalar } from './templates/models/entity.seed.ts';
import { entityCollection } from './templates/persistence/entity.domain-adapter.ts';
import { mergeParams, mongooseField, nestedPropType, structuralType, tsType } from './text.ts';
import type { GeneratedFile, GenerateFeatureOptions } from './types.ts';

/** Adds fields and nested objects onto a subdomain that already exists. Existing members stay. */
export async function extendShape(options: GenerateFeatureOptions, fields: FieldSpec[], nested: NestedSpec[]): Promise<GeneratedFile[]> {
	const shape = extendMembers(options.entity, mergeFields(fields), nested);
	const entityPascal = pascal(options.entity);
	const domainDir = path.join(options.root, options.lint.layers.domain, 'domain/contexts', options.context, options.entity);
	const aggregatePath = path.join(domainDir, `${options.entity}.aggregate.ts`);
	const aggregate = await readFile(aggregatePath, 'utf8');
	const permission = aggregate.match(/permissions\.(\w+)/)?.[1] ?? `canManage${entityPascal}`;
	const freshFields = shape.fields.filter((field) => !hasMember(aggregate, `export interface ${entityPascal}Props`, field.name));
	const freshNested = shape.nested.filter((item) => !hasMember(aggregate, `export interface ${entityPascal}Props`, item.camel));
	if (freshFields.length === 0 && freshNested.length === 0) {
		throw new Error('Nothing to add. Those fields and nested objects are already on the subdomain.');
	}
	const written = await writeNestedFiles(domainDir, options.context, freshNested, permission);
	written.push(await rewrite(aggregatePath, extendAggregate(aggregate, options.entity, entityPascal, freshFields, freshNested, permission)));
	written.push(await rewrite(path.join(domainDir, `${options.entity}.value-objects.ts`), await extendValueObjects(domainDir, options.entity, freshFields)));
	const modelPath = path.join(options.root, options.lint.layers.models, 'models', options.entity, `${options.entity}.model.ts`);
	written.push(await rewrite(modelPath, extendModel(await readFile(modelPath, 'utf8'), entityPascal, freshFields, freshNested)));
	const seedPath = path.join(options.root, options.lint.layers.models, 'models', options.entity, `${options.entity}.seed.ts`);
	written.push(await rewrite(seedPath, extendSeed(await readFile(seedPath, 'utf8'), freshFields, freshNested)));
	const adapterPath = path.join(options.root, options.lint.layers.persistence, 'datasources/domain', options.context, options.entity, `${options.entity}.domain-adapter.ts`);
	written.push(await rewrite(adapterPath, extendAdapter(await readFile(adapterPath, 'utf8'), pascal(options.context), entityPascal, freshFields, freshNested)));
	const repositoryPath = path.join(options.root, options.lint.layers.persistence, 'datasources/domain', options.context, options.entity, `${options.entity}.repository.ts`);
	written.push(await rewrite(repositoryPath, extendRepository(await readFile(repositoryPath, 'utf8'), freshFields, freshNested)));
	const actionDir = path.join(options.root, options.lint.layers.applicationServices, 'contexts', options.context, options.entity);
	for (const file of await actionFiles(actionDir)) {
		const current = await readFile(file, 'utf8');
		if (!current.includes('getNewInstance(')) continue;
		written.push(await rewrite(file, extendAction(current, freshFields, freshNested)));
	}
	return written;
}

/** Adds parameters to a query or update that already exists. The action body stays. */
export async function extendCommand(options: GenerateFeatureOptions, params: FieldSpec[]): Promise<GeneratedFile[]> {
	const action = options.action;
	if (!action) throw new Error('Pass --name.');
	const actionPath = path.join(options.root, options.lint.layers.applicationServices, 'contexts', options.context, options.entity, `${action}.ts`);
	let current: string;
	try {
		current = await readFile(actionPath, 'utf8');
	} catch {
		throw new Error(`Create ${action} with query or run update before extend adds a parameter.`);
	}
	const commandName = current.match(/export interface (\w*Command)\b/)?.[1];
	if (!commandName) throw new Error(`extend did not find a command interface on ${action}.`);
	const query = current.includes('readonlyDataSource');
	const fresh = mergeParams(params).filter((param) => !hasMember(current, `export interface ${commandName}`, param.name));
	if (fresh.length === 0) throw new Error('Nothing to add. Those parameters are already on the command.');
	for (const param of fresh) {
		const optional = query || param.optional ? '?' : '';
		current = addProperty(current, `export interface ${commandName}`, `${param.name}${optional}: ${tsType(param.type)}`);
	}
	const written = [await rewrite(actionPath, current)];
	if (!query) return written;
	const readPath = path.join(options.root, options.lint.layers.persistence, 'datasources/readonly', options.context, options.entity, `${options.entity}.read-repository.ts`);
	let read = await readFile(readPath, 'utf8');
	const method = camel(action);
	if (!read.includes(`${method}(command:`) && !read.includes(`${method}: (command:`)) {
		throw new Error(`extend did not find ${method} on the read repository.`);
	}
	for (const param of fresh) {
		const property = `${param.name}?: ${tsType(param.type)}`;
		read = addInlineProperty(read, `${method}: (command:`, property);
		read = addInlineProperty(read, `${method}(command:`, property);
	}
	written.push(await rewrite(readPath, read));
	return written;
}

function extendAggregate(source: string, entity: string, entityPascal: string, fields: ShapeField[], nested: ShapeNested[], permission: string): string {
	let current = source;
	for (const item of nested) {
		const imported = childImport(item);
		if (!current.includes(`./${item.name}.`)) {
			const anchor = `import * as ValueObjects from './${entity}.value-objects.ts';`;
			current = current.includes(anchor) ? current.replace(anchor, `${anchor}\n${imported}`) : `${imported}\n${current}`;
		}
		if (item.kind === 'entity') {
			current = ensureEntityReference(current, entityPascal, item);
			if (!current.includes("from '@cellix/domain-seedwork/prop-array'")) {
				current = `import type { PropArray } from '@cellix/domain-seedwork/prop-array';\n${current}`;
			}
		}
	}
	for (const field of fields) {
		const line = `${field.name}: ${tsType(field.type)}`;
		current = addProperty(current, `export interface ${entityPascal}Props`, line);
		current = addProperty(current, `export interface ${entityPascal}NewInput`, line);
		if (!current.includes(`newInstance.${field.name} =`)) current = current.replace('\t\tnewInstance.isNew = false;', `\t\tnewInstance.${field.name} = input.${field.name};\n\t\tnewInstance.isNew = false;`);
		if (!current.includes(`get ${field.name}(`)) current = current.replace('\tget createdAt(): Date {', `${scalarMembers(field, permission)}\n\n\tget createdAt(): Date {`);
	}
	for (const item of nested) {
		current = addProperty(current, `export interface ${entityPascal}Props`, `${item.camel}: ${nestedPropType(item)}`);
		if (item.kind !== 'entity') {
			current = addProperty(current, `export interface ${entityPascal}NewInput`, `${item.camel}: ${item.pascal}Props`);
			if (!current.includes(`newInstance.${item.camel} =`)) current = current.replace('\t\tnewInstance.isNew = false;', `\t\tnewInstance.${item.camel} = input.${item.camel};\n\t\tnewInstance.isNew = false;`);
		}
		if (!current.includes(`get ${item.camel}(`)) current = current.replace('\tget createdAt(): Date {', `${nestedMembers(item, permission)}\n\n\tget createdAt(): Date {`);
	}
	return current;
}

async function extendValueObjects(domainDir: string, entity: string, fields: ShapeField[]): Promise<string> {
	const file = path.join(domainDir, `${entity}.value-objects.ts`);
	let current = await readFile(file, 'utf8');
	for (const field of fields) {
		if (field.type !== 'string' || current.includes(`export class ${field.pascal} `) || current.includes(`export class ${field.pascal} extends`)) continue;
		current = `${current.trimEnd()}\nexport class ${field.pascal} extends VOString({\n\ttrim: true,\n\tminLength: 1,\n\tmaxLength: 200,\n}) {}\n`;
	}
	return current;
}

function extendModel(source: string, entityPascal: string, fields: ShapeField[], nested: ShapeNested[]): string {
	let current = source;
	for (const item of nested) {
		const interfaces = modelInterfaces(entityPascal, [item]).trim();
		if (interfaces.length > 0 && !current.includes(`export interface ${entityPascal}${item.pascal}`)) {
			current = current.replace(`export interface ${entityPascal} `, `${interfaces}\n\nexport interface ${entityPascal} `);
		}
	}
	for (const field of fields) {
		current = addProperty(current, `export interface ${entityPascal} `, `${field.name}: ${tsType(field.type)}`);
		const schema = `\t\t${field.name}: ${mongooseField(field)},`;
		if (!current.includes(schema.trim())) current = insertSchema(current, schema, entityPascal);
	}
	for (const item of nested) {
		if (item.kind === 'entity' && !current.includes(', Types')) {
			current = current.replace("import { type Model, Schema } from 'mongoose'", "import { type Model, Schema, Types } from 'mongoose'");
		}
		const schemaName = `${entityPascal}${item.pascal}Schema`;
		if (item.kind === 'entity' && !current.includes(`const ${schemaName}`)) {
			const block = nestedSchemaConsts(entityPascal, [item]);
			current = current.replace(`const ${entityPascal}Schema`, `${block}\n\nconst ${entityPascal}Schema`);
		}
		current = addProperty(current, `export interface ${entityPascal} `, modelField(entityPascal, item));
		const schema = modelSchemaField(entityPascal, item);
		if (!current.includes(`\t\t${item.camel}:`)) current = insertSchema(current, schema, entityPascal);
	}
	return current;
}

function extendSeed(source: string, fields: ShapeField[], nested: ShapeNested[]): string {
	let current = source;
	for (const field of fields) current = addSeedEntry(current, field.name, seedScalar(field));
	for (const item of nested) current = addSeedEntry(current, item.camel, seedNested(item));
	return current;
}

function extendAdapter(source: string, contextPascal: string, entityPascal: string, fields: ShapeField[], nested: ShapeNested[]): string {
	let current = source;
	for (const field of fields) {
		if (current.includes(`get ${field.name}(`)) continue;
		current = insertInParentAdapter(current, entityPascal, adapterMember(field.name, tsType(field.type)));
	}
	const propsRoot = `Domain.Contexts.${contextPascal}.${entityPascal}`;
	for (const item of nested) {
		if (current.includes(`get ${item.camel}(`)) continue;
		if (item.kind !== 'entity') {
			current = insertInParentAdapter(current, entityPascal, adapterMember(item.camel, structuralType(item)));
			continue;
		}
		const piece = entityCollection(item, entityPascal, propsRoot);
		if (!current.includes("from '@cellix/domain-seedwork/prop-array'")) current = `import type { PropArray } from '@cellix/domain-seedwork/prop-array';\n${current}`;
		for (const docType of piece.docTypes) {
			if (!current.includes(docType)) current = current.replace(`import type { ${entityPascal} }`, `import type { ${entityPascal}, ${docType} }`);
		}
		current = insertInParentAdapter(current, entityPascal, piece.getter);
		current = `${current.trimEnd()}\n\n${piece.classText}\n`;
	}
	return current;
}

function extendRepository(source: string, fields: ShapeField[], nested: ShapeNested[]): string {
	let current = source;
	for (const field of fields) current = addInlineProperty(current, 'getNewInstance(input:', `${field.name}: ${tsType(field.type)}`);
	for (const item of nested) {
		if (item.kind === 'entity') continue;
		current = addInlineProperty(current, 'getNewInstance(input:', `${item.camel}: ${structuralType(item)}`);
	}
	return current;
}

function extendAction(source: string, fields: ShapeField[], nested: ShapeNested[]): string {
	let current = source;
	const command = current.match(/export interface (\w*Command)\b/)?.[1];
	const members = [...fields.map((field) => ({ name: field.name, type: tsType(field.type) })), ...nested.filter((item) => item.kind !== 'entity').map((item) => ({ name: item.camel, type: structuralType(item) }))];
	for (const field of members) {
		if (command) current = addProperty(current, `export interface ${command}`, `${field.name}: ${field.type}`);
		current = addCallProperty(current, field.name);
	}
	return current;
}

function adapterMember(name: string, type: string): string {
	return `\tget ${name}(): ${type} {\n\t\treturn this.doc.${name};\n\t}\n\tset ${name}(${name}: ${type}) {\n\t\tthis.doc.${name} = ${name};\n\t}`;
}

function addSeedEntry(source: string, key: string, value: string): string {
	const line = `\t\t${key}: ${value},`;
	return source.replace(/\n\t\{([\s\S]*?)\n\t\}/g, (object) => {
		if (new RegExp(`\\b${key}:`).test(object)) return object;
		if (object.includes('\n\t\tcreatedAt:')) return object.replace('\n\t\tcreatedAt:', `\n${line}\n\t\tcreatedAt:`);
		return object.replace('\n\t}', `\n${line}\n\t}`);
	});
}

function insertSchema(source: string, schema: string, entityPascal = ''): string {
	const marker = "{ timestamps: true, versionKey: 'version' }";
	const schemaName = entityPascal.length > 0 ? source.indexOf(`const ${entityPascal}Schema`) : 0;
	const at = source.indexOf(marker, schemaName < 0 ? 0 : schemaName);
	if (at < 0) return source;
	const close = source.lastIndexOf('},', at);
	if (close < 0) return source;
	return `${source.slice(0, close)}${schema}\n\t${source.slice(close)}`;
}

function ensureEntityReference(source: string, entityPascal: string, item: ShapeNested): string {
	const simple = `export interface ${entityPascal}EntityReference extends Readonly<${entityPascal}Props> {}`;
	if (source.includes(simple)) return source.replace(simple, entityReference(entityPascal, [item]));
	const header = `export interface ${entityPascal}EntityReference`;
	if (!source.includes(header)) return source;
	let current = source;
	const omit = `Omit<${entityPascal}Props, `;
	const at = current.indexOf(omit);
	if (at >= 0) {
		const end = current.indexOf('>', at);
		if (end > at && !current.slice(at, end).includes(`'${item.camel}'`)) current = `${current.slice(0, end)} | '${item.camel}'${current.slice(end)}`;
	}
	return addProperty(current, header, `readonly ${item.camel}: ReadonlyArray<${item.pascal}EntityReference>`);
}

function addCallProperty(source: string, name: string): string {
	const marker = 'getNewInstance(';
	const start = source.indexOf(marker);
	if (start < 0) return source;
	const open = source.indexOf('{', start);
	const closeParen = source.indexOf(')', start);
	if (open < 0 || closeParen < open) return source;
	const close = matchingBrace(source, open);
	if (close < 0) return source;
	const body = source.slice(open + 1, close);
	if (new RegExp(`\\b${name}\\b`).test(body)) return source;
	const addition = body.trim().length === 0 ? `${name}: command.${name}` : `${body.trim().replace(/,$/, '')}, ${name}: command.${name}`;
	return `${source.slice(0, open + 1)} ${addition} ${source.slice(close)}`;
}

function addInlineProperty(source: string, header: string, property: string): string {
	const start = source.indexOf(header);
	if (start < 0) return source;
	const open = source.indexOf('{', start);
	const closeParen = source.indexOf(')', start);
	if (open < 0 || closeParen < open) return source;
	return addPropertyAt(source, open, property);
}

function addProperty(source: string, header: string, property: string): string {
	const start = source.indexOf(header);
	if (start < 0) return source;
	const open = source.indexOf('{', start);
	if (open < 0) return source;
	return addPropertyAt(source, open, property);
}

function addPropertyAt(source: string, open: number, property: string): string {
	const close = matchingBrace(source, open);
	if (close < 0) return source;
	const body = source.slice(open + 1, close);
	const key = property.split(':')[0]?.replaceAll('?', '').trim() ?? '';
	if (new RegExp(`\\b${key}\\s*\\??\\s*:`).test(body)) return source;
	if (body.includes('\n')) return `${source.slice(0, close)}\n\t${property};\n${source.slice(close)}`;
	const trimmed = body.trim().replace(/;+$/, '');
	const next = trimmed.length === 0 ? ` ${property} ` : ` ${trimmed}; ${property} `;
	return `${source.slice(0, open + 1)}${next}${source.slice(close)}`;
}

function hasMember(source: string, header: string, name: string): boolean {
	const start = source.indexOf(header);
	if (start < 0) return false;
	const open = source.indexOf('{', start);
	const close = matchingBrace(source, open);
	if (open < 0 || close < 0) return false;
	return new RegExp(`\\b${name}\\s*\\??\\s*:`).test(source.slice(open + 1, close));
}

function matchingBrace(source: string, open: number): number {
	let depth = 0;
	for (let index = open; index < source.length; index += 1) {
		if (source[index] === '{') depth += 1;
		if (source[index] === '}') {
			depth -= 1;
			if (depth === 0) return index;
		}
	}
	return -1;
}

function insertInParentAdapter(source: string, entityPascal: string, member: string): string {
	const header = `export class ${entityPascal}DomainAdapter`;
	const start = source.indexOf(header);
	if (start < 0) return insertBeforeLastBrace(source, member);
	const open = source.indexOf('{', start);
	const close = matchingBrace(source, open);
	if (open < 0 || close < 0) return source;
	return `${source.slice(0, close)}\n${member}\n${source.slice(close)}`;
}

function insertBeforeLastBrace(source: string, member: string): string {
	const at = source.lastIndexOf('\n}');
	if (at < 0) return `${source.trimEnd()}\n${member}\n`;
	return `${source.slice(0, at)}\n${member}${source.slice(at)}`;
}

async function writeNestedFiles(domainDir: string, context: string, nested: ShapeNested[], permission: string): Promise<GeneratedFile[]> {
	const files = nested.flatMap((item) => nestedFileContents(domainDir, context, item, permission));
	const written: GeneratedFile[] = [];
	for (const file of files) {
		try {
			await readFile(file.path);
		} catch {
			await mkdir(path.dirname(file.path), { recursive: true });
			await writeFile(file.path, file.contents);
			written.push(file);
		}
	}
	return written;
}

function nestedFileContents(domainDir: string, context: string, item: ShapeNested, permission: string): GeneratedFile[] {
	const children = item.fields.filter(isShapeNested).flatMap((child) => nestedFileContents(domainDir, context, child, permission));
	const strings = item.fields.filter((member) => !isShapeNested(member) && member.type === 'string').map((member) => member.pascal);
	const files = [...children];
	if (item.kind === 'value' || strings.length > 0) files.push({ path: path.join(domainDir, `${item.name}.value-objects.ts`), contents: nestedValueObject(item, strings) });
	if (item.kind === 'entity') files.push({ path: path.join(domainDir, `${item.name}.entity.ts`), contents: nestedEntity(item, context, permission) });
	return files;
}

async function actionFiles(directory: string): Promise<string[]> {
	try {
		const names = await readdir(directory);
		return names.filter((name) => name.endsWith('.ts') && name !== 'index.ts').map((name) => path.join(directory, name));
	} catch {
		return [];
	}
}

async function rewrite(file: string, contents: string): Promise<GeneratedFile> {
	await writeFile(file, contents);
	return { path: file, contents };
}
