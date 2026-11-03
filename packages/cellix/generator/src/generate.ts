import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { wireComposition } from './compose.ts';
import { extendCommand, extendShape } from './extend-shape.ts';
import { formatGeneratedFiles } from './format.ts';
import { camel } from './names.ts';
import { plan } from './plan.ts';
import { assertOperationName } from './text.ts';
import type { GeneratedFile, GenerateFeatureOptions } from './types.ts';
import { writeNewFiles } from './write/new-files.ts';

export { plan } from './plan.ts';
export type { GeneratedFile, GenerateFeatureOptions } from './types.ts';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEGMENT = /(?:[A-Za-z][A-Za-z0-9-]*|:[A-Za-z][A-Za-z0-9-]*)/;
const ROUTE = new RegExp(`^${SEGMENT.source}(?:/${SEGMENT.source})*$`);

export async function generateFeature(options: GenerateFeatureOptions): Promise<GeneratedFile[]> {
	if (!KEBAB.test(options.context) || !KEBAB.test(options.entity) || (options.action !== undefined && !KEBAB.test(options.action))) {
		throw new Error('context, subdomain, and action must be kebab-case');
	}
	if (options.operation === 'extend') return extendExisting(options);
	if (options.operation && !options.action) throw new Error('Missing --name');
	if (options.operation === 'query' && ((options.fields?.length ?? 0) > 0 || (options.nested?.length ?? 0) > 0 || (options.permissions?.length ?? 0) > 0)) {
		throw new Error('Pass --field on generate, not on query.');
	}
	if (options.method !== undefined && !/^(?:get|post|patch|put|delete)$/.test(options.method)) throw new Error(`Method must be get, post, patch, put, or delete, received ${options.method}`);
	if (options.method && options.transport !== 'rest') throw new Error('Pass --method with --transport rest.');
	if (options.route && options.transport !== 'rest' && options.transport !== 'graphql') throw new Error('Pass --transport rest or --transport graphql.');
	if (options.transport === 'rest' && !options.route) throw new Error('Pass --route for rest.');
	if (options.operation) {
		if (options.transport !== 'rest' && options.transport !== 'graphql') throw new Error('Pass --transport rest or --transport graphql.');
		await requireSubdomain(options);
	}
	if (!options.operation && !options.action && ((options.fields?.length ?? 0) > 0 || (options.nested?.length ?? 0) > 0) && (await subdomainExists(options))) {
		throw new Error('The subdomain exists. Add fields and nested objects with extend.');
	}
	if (options.operation === 'query' || options.operation === 'update') {
		if (options.action) assertOperationName(camel(options.action), options.operation);
	}
	if (options.route !== undefined && !ROUTE.test(options.route)) throw new Error(`Route must be a path of names and :params, received ${options.route}`);
	if (options.result !== undefined && !/^[A-Za-z0-9_|&[\]'". ,:{}<>]+$/.test(options.result)) throw new Error(`Return type must be a type, received ${options.result}`);
	const writes = await writeNewFiles(options, plan(options));
	const composed = await wireComposition(options);
	formatGeneratedFiles([...writes, ...composed]);
	for (const file of writes) file.contents = await readFile(file.path, 'utf8');
	return writes;
}

async function extendExisting(options: GenerateFeatureOptions): Promise<GeneratedFile[]> {
	if (options.route || options.transport || options.method) {
		throw new Error('extend adds fields, nested objects, or parameters. Leave --route and --transport off.');
	}
	if (options.action) {
		if ((options.fields?.length ?? 0) > 0 || (options.nested?.length ?? 0) > 0) {
			throw new Error('extend --name adds --param values to that query or update. Leave --field and --nested off.');
		}
		if ((options.params?.length ?? 0) === 0) throw new Error('Pass --param.');
		const writes = await extendCommand(options, options.params ?? []);
		formatGeneratedFiles(writes);
		for (const file of writes) file.contents = await readFile(file.path, 'utf8');
		return writes;
	}
	if ((options.params?.length ?? 0) > 0) throw new Error('Pass --name with --param. extend without --name adds --field and --nested.');
	if ((options.fields?.length ?? 0) === 0 && (options.nested?.length ?? 0) === 0) throw new Error('Pass --field or --nested.');
	if (!(await subdomainExists(options))) throw new Error('Generate the subdomain before extend. extend adds fields and nested objects. It does not build the subdomain.');
	const writes = await extendShape(options, options.fields ?? [], options.nested ?? []);
	formatGeneratedFiles(writes);
	for (const file of writes) file.contents = await readFile(file.path, 'utf8');
	return writes;
}

async function subdomainExists(options: GenerateFeatureOptions): Promise<boolean> {
	try {
		await access(path.join(options.root, options.lint.layers.domain, 'domain/contexts', options.context, options.entity, `${options.entity}.aggregate.ts`));
		return true;
	} catch {
		return false;
	}
}

async function requireSubdomain(options: GenerateFeatureOptions): Promise<void> {
	const aggregate = path.join(options.root, options.lint.layers.domain, 'domain/contexts', options.context, options.entity, `${options.entity}.aggregate.ts`);
	try {
		await access(aggregate);
	} catch {
		throw new Error(`Generate the subdomain before ${options.operation}. ${options.operation} adds a function. It does not build the subdomain.`);
	}
}
