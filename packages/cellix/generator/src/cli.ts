#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findCellixRoot, loadGenerateLayout } from './config.js';
import { filesToEdit } from './edit-targets.js';
import { type GenerateFeatureOptions, generateFeature } from './generate.js';
import { mergeFields, parseArgv, parseField, parseFieldsFile, parseNested, parseParam, parsePermission } from './spec.js';

const argv = process.argv.slice(2);
const head = argv[0];
const operation = head === 'query' || head === 'update' || head === 'extend' ? head : undefined;
const args = parseArgv(operation ? argv.slice(1) : argv);
const root = await findCellixRoot(process.cwd());
const lint = await loadGenerateLayout(root);
const transport = args.get('transport');
const fieldsFile = args.get('fields');
const fromFile = fieldsFile ? parseFieldsFile(await readFile(path.resolve(fieldsFile), 'utf8')) : { fields: [], permissions: [], nested: [] };
const fields = mergeFields([...fromFile.fields, ...args.list('field').map((token) => parseField(token))]);
const params = args.list('param').map((token) => parseParam(token));
const permissions = [...fromFile.permissions, ...args.list('permission').map((token) => parsePermission(token))];
const nested = [...fromFile.nested, ...args.list('nested').map((token) => parseNested(token))];
const result = args.get('return');
const route = args.get('route');
const method = args.get('method');
if (args.get('entity') !== undefined) throw new Error('Use --subdomain.');
if (argv.includes('--help') || argv.includes('-h')) {
	console.log('generate builds the subdomain. It does not add a search route. Pass --field on generate, not on query.');
	console.log('pnpm --filter @cellix/generator generate -- --context <context> --subdomain <subdomain> --field <field>:<type>');
	console.log('pnpm --filter @cellix/generator query -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --route <route> --transport rest');
	console.log('pnpm --filter @cellix/generator query -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --transport graphql');
	console.log('pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --field <field>:<type> --nested <name>:<field>:<type>');
	console.log('pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type>');
	process.exit(0);
}
if (operation === 'query' && (fields.length > 0 || nested.length > 0 || permissions.length > 0 || fieldsFile !== undefined)) {
	throw new Error('Pass --field on generate, not on query.');
}
if (operation === 'extend' && (transport !== undefined || route !== undefined || method !== undefined)) {
	throw new Error('extend adds fields, nested objects, or parameters. Leave --route and --transport off.');
}
const extendName = operation === 'extend' ? (args.get('name') ?? args.get('action')) : undefined;
if (operation === 'extend' && extendName && (fields.length > 0 || nested.length > 0)) {
	throw new Error('extend --name adds --param values to that query or update. Leave --field and --nested off.');
}
if (operation === 'extend' && extendName && params.length === 0) throw new Error('Pass --param.');
if (operation === 'extend' && !extendName && params.length > 0) throw new Error('Pass --name with --param.');
if (operation === 'extend' && !extendName && fields.length === 0 && nested.length === 0) throw new Error('Pass --field or --nested.');
if (operation && operation !== 'extend' && transport !== 'rest' && transport !== 'graphql') throw new Error('Pass --transport rest or --transport graphql.');
if (operation && operation !== 'extend' && transport === 'rest' && route === undefined) throw new Error('Pass --route for rest.');
if (method !== undefined && method !== 'get' && method !== 'post' && method !== 'patch' && method !== 'put' && method !== 'delete') {
	throw new Error(`Method must be get, post, patch, put, or delete, received ${method}`);
}
const action = operation === 'extend' ? extendName : operation ? required(args, 'name') : args.get('action');
const carryShape = operation !== 'query';
const feature: GenerateFeatureOptions = {
	root,
	lint,
	context: required(args),
	entity: required(args, 'subdomain'),
	...(action ? { action } : {}),
	...(operation === 'extend' ? { operation, ...(params.length > 0 ? { params } : {}) } : {}),
	...(operation && operation !== 'extend' ? { operation, params } : {}),
	...(transport === 'rest' || transport === 'graphql' ? { transport } : {}),
	...(carryShape && fields.length > 0 ? { fields } : {}),
	...(carryShape && permissions.length > 0 ? { permissions } : {}),
	...(carryShape && nested.length > 0 ? { nested } : {}),
	...(args.has('resolver') ? { resolver: true } : {}),
	...(result !== undefined ? { result } : {}),
	...(route !== undefined ? { route } : {}),
	...(method === 'get' || method === 'post' || method === 'patch' || method === 'put' || method === 'delete' ? { method } : {}),
};
const before = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
const files = await generateFeature(feature);
const after = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
const manifests = (after.stdout ?? '').split('\n').filter((line) => line.includes('package.json') && !(before.stdout ?? '').includes(line));
if (manifests.length > 0) {
	const install = spawnSync('pnpm', ['install'], { cwd: root, stdio: 'inherit' });
	if (install.status !== 0) process.exit(install.status ?? 1);
}
const violations = await repoAfter(feature, files);
if (violations.length > 0) {
	console.error(violations.join('\n\n'));
	process.exit(1);
}
for (const file of filesToEdit(feature)) {
	console.log(file);
}
console.log('Edit these. The barrels are already wired. Do not list the tree.');
console.log('While editing, run pnpm run agent-check -- pnpm run check. Do not pipe it to tail. The Expected line is the next edit.');
console.log('Run pnpm run agent-check -- pnpm run verify once before you stop.');

async function repoAfter(feature: GenerateFeatureOptions, files: { path: string }[]): Promise<string[]> {
	const hook = path.join(feature.root, 'scripts/generator-after.mjs');
	try {
		const mod = (await import(pathToFileURL(hook).href)) as { afterGenerate: (options: GenerateFeatureOptions, written: { path: string }[]) => Promise<string[]> };
		return await mod.afterGenerate(feature, files);
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('generator-after.mjs')) return [];
		throw error;
	}
}

function required(args: ReturnType<typeof parseArgv>, key = 'context'): string {
	const value = args.get(key);
	if (!value) throw new Error(`Missing --${key}`);
	return value;
}
