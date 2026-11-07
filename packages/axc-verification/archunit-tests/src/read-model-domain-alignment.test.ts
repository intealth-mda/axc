import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(packageDir, '../../..');
const applicationContexts = path.join(projectRoot, 'packages/axc/application-services/src/contexts');
const readonlyContexts = path.join(projectRoot, 'packages/axc/persistence/src/datasources/readonly');
const domainContexts = path.join(projectRoot, 'packages/axc/domain/src/domain/contexts');

async function exists(file: string): Promise<boolean> {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}

async function entitySlices(root: string): Promise<string[]> {
	if (!(await exists(root))) return [];
	const contexts = (await readdir(root, { withFileTypes: true })).filter((item) => item.isDirectory());
	const slices = await Promise.all(contexts.map(async (context) => (await readdir(path.join(root, context.name), { withFileTypes: true })).filter((item) => item.isDirectory()).map((entity) => `${context.name}/${entity.name}`)));
	return slices.flat();
}

async function aggregateFiles(root: string): Promise<string[]> {
	if (!(await exists(root))) return [];
	const entries = await readdir(root, { withFileTypes: true });
	const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => aggregateFiles(path.join(root, entry.name))));
	return [...entries.filter((entry) => entry.isFile() && entry.name.endsWith('.aggregate.ts')).map((entry) => path.join(root, entry.name)), ...nested.flat()];
}

describe('read-side domain alignment', () => {
	it('resolves the repository root before scanning feature slices', async () => {
		expect(await exists(path.join(projectRoot, 'package.json'))).toBe(true);
		expect(await exists(path.join(projectRoot, 'packages/axc/domain/package.json'))).toBe(true);
	});

	it('requires an aggregate and public reference for every persisted business object, even when the API only queries it', async () => {
		const slices = new Set([...(await entitySlices(applicationContexts)), ...(await entitySlices(readonlyContexts))]);
		const violations: string[] = [];
		for (const slice of slices) {
			const [context, entity] = slice.split('/');
			if (!context || !entity) continue;
			const domainDir = path.join(domainContexts, context, entity);
			if (!(await exists(domainDir))) {
				violations.push(`${slice}: missing matching domain entity directory`);
				continue;
			}
			const files = await readdir(domainDir);
			const entityFile = files.find((file) => file.endsWith('.aggregate.ts'));
			if (!entityFile) {
				violations.push(`${slice}: missing domain aggregate; query-only API access does not make a persisted object a projection`);
				continue;
			}
			const source = await readFile(path.join(domainDir, entityFile), 'utf8');
			if (!source.includes('extends AggregateRoot<')) violations.push(`${slice}: aggregate must extend Cellix AggregateRoot`);
			if (!source.includes('DomainEntityProps') || !source.includes('EntityReference')) violations.push(`${slice}: missing domain props or entity reference`);
			const entityIndex = path.join(domainDir, 'index.ts');
			if (!(await exists(entityIndex)) || !(await readFile(entityIndex, 'utf8')).includes(`./${entityFile}`)) violations.push(`${slice}: missing entity public export`);
			const contextIndex = path.join(domainContexts, context, 'index.ts');
			if (!(await exists(contextIndex)) || !(await readFile(contextIndex, 'utf8')).includes(`./${entity}/index.ts`)) violations.push(`${slice}: missing context public export`);
			const readRepository = path.join(readonlyContexts, slice, `${entity}.read-repository.ts`);
			if (await exists(readRepository)) {
				const readSource = await readFile(readRepository, 'utf8');
				if (!readSource.includes("from '@axc/domain'") || !readSource.includes('EntityReference')) violations.push(`${slice}: read repository must use the domain entity reference`);
			}
		}
		expect(violations).toStrictEqual([]);
	});

	it('requires every domain aggregate to define getNewInstance', async () => {
		const violations: string[] = [];
		for (const file of await aggregateFiles(domainContexts)) {
			const source = await readFile(file, 'utf8');
			if (!/\bstatic\s+getNewInstance\b/.test(source)) violations.push(path.relative(projectRoot, file));
		}
		expect(violations).toStrictEqual([]);
	});

	it('requires read-side aggregates to define, use, export, and test constrained value objects', async () => {
		const slices = new Set([...(await entitySlices(applicationContexts)), ...(await entitySlices(readonlyContexts))]);
		const violations: string[] = [];
		for (const slice of slices) {
			const [context, entity] = slice.split('/');
			if (!context || !entity) continue;
			const domainDir = path.join(domainContexts, context, entity);
			const aggregateFile = path.join(domainDir, `${entity}.aggregate.ts`);
			if (!(await exists(aggregateFile))) continue; // The aggregate check reports this omission.
			const valueObjectsFile = `${entity}.value-objects.ts`;
			const valueObjectsPath = path.join(domainDir, valueObjectsFile);
			if (!(await exists(valueObjectsPath))) {
				violations.push(`${slice}: missing ${valueObjectsFile}`);
				continue;
			}
			const source = await readFile(valueObjectsPath, 'utf8');
			if (!/export\s+class\s+\w+\s+extends\s+(?:ValueObject|VO\w+)\b/.test(source)) violations.push(`${slice}: value objects must define exported constrained classes`);
			const aggregateSource = await readFile(aggregateFile, 'utf8');
			if (!aggregateSource.includes(`./${valueObjectsFile}`)) violations.push(`${slice}: aggregate must use its value objects`);
			if (!(await exists(path.join(domainDir, `${entity}.value-objects.test.ts`)))) violations.push(`${slice}: missing focused value-object tests`);
			const indexPath = path.join(domainDir, 'index.ts');
			if (!(await exists(indexPath)) || !(await readFile(indexPath, 'utf8')).includes(`./${valueObjectsFile}`)) violations.push(`${slice}: value objects must be publicly exported`);
		}
		expect(violations).toStrictEqual([]);
	});
});
