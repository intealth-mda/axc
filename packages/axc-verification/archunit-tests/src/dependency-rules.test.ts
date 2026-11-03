import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DependencyRulesTestsConfig, describeDependencyRulesTests } from '@cellix/archunit-tests/general';
import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';
import { importedSpecifiers, isProductionSource, listFiles } from './support/source-files.ts';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const axcDir = path.resolve(packageDir, '../../axc');
const appsDir = path.resolve(packageDir, '../../../apps');

const config: DependencyRulesTestsConfig = {
	appsGlob: '../../../apps/**',
	packagesGlob: '../../**',
	domainFolder: '../../axc/domain',
	persistenceFolder: '../../axc/persistence',
	applicationServicesFolder: '../../axc/application-services',
	restFolder: '../../axc/rest',
	infrastructurePattern: '../../axc/service-mongoose/**',
	restInfrastructurePattern: '../../axc/service-mongoose/**',
};

describeDependencyRulesTests(config);

const forbiddenDomainImports = ['hono', '@azure/', 'mongoose', 'mongodb', '@axc/rest', '@axc/persistence', '@axc/service-mongoose', '@axc/application-services'];

describe('domain import boundary', () => {
	it('domain sources do not import delivery or persistence implementations', async () => {
		const domainSrc = path.resolve(packageDir, '../../axc/domain/src');
		const files = await listTypeScriptFiles(domainSrc);
		expect(files.length).toBeGreaterThan(0);
		for (const file of files) {
			const text = await readFile(file, 'utf8');
			for (const specifier of forbiddenDomainImports) {
				expect(text.includes(`'${specifier}`) || text.includes(`"${specifier}`), `${path.basename(file)} imports ${specifier}`).toBe(false);
			}
		}
	});

	it('domain does not depend on the rest package', async () => {
		await projectFiles().inFolder(path.resolve(packageDir, '../../axc/domain')).shouldNot().dependOnFiles().inFolder(path.resolve(packageDir, '../../axc/rest')).check();
	});
});

// archunit's projectFiles() only sees files in the current package's tsconfig,
// so cross-package layering is checked by reading import specifiers directly.
interface LayerRule {
	layer: string;
	folder: string;
	forbidden: string[];
}

const rules: LayerRule[] = [
	{
		layer: '@axc/domain',
		folder: path.join(axcDir, 'domain/src'),
		forbidden: ['hono', '@azure/', 'mongoose', 'mongodb', '@axc/rest', '@axc/persistence', '@axc/service-mongoose', '@axc/application-services', '@apps/', 'node:fs', 'node:http'],
	},
	{
		layer: '@axc/application-services',
		folder: path.join(axcDir, 'application-services/src'),
		forbidden: ['hono', '@azure/', 'mongoose', 'mongodb', '@axc/rest', '@axc/service-mongoose', '@apps/'],
	},
	{
		layer: '@axc/persistence',
		folder: path.join(axcDir, 'persistence/src'),
		forbidden: ['hono', '@azure/', '@axc/rest', '@axc/application-services', '@axc/service-mongoose', '@apps/'],
	},
	{
		layer: '@axc/rest',
		folder: path.join(axcDir, 'rest/src'),
		forbidden: ['mongoose', 'mongodb', '@axc/persistence', '@axc/service-mongoose', '@apps/'],
	},
	{
		layer: '@axc/service-mongoose',
		folder: path.join(axcDir, 'service-mongoose/src'),
		forbidden: ['hono', '@axc/rest', '@axc/application-services', '@axc/domain', '@axc/persistence', '@apps/'],
	},
];

describe('layer dependency rules', () => {
	for (const rule of rules) {
		it(`${rule.layer} does not import ${rule.forbidden.join(', ')}`, async () => {
			const files = await listFiles(rule.folder, isProductionSource);
			expect(files.length, `${rule.layer} has no sources under ${rule.folder}`).toBeGreaterThan(0);
			const violations: string[] = [];
			for (const file of files) {
				for (const specifier of importedSpecifiers(file.content)) {
					if (rule.forbidden.some((prefix) => specifier === prefix || specifier.startsWith(prefix))) {
						violations.push(`${file.relativePath} imports ${specifier}`);
					}
				}
			}
			expect(violations).toEqual([]);
		});
	}

	it('the api app composes packages but never reaches into their src folders', async () => {
		const files = await listFiles(path.join(appsDir, 'api/src'), isProductionSource);
		expect(files.length).toBeGreaterThan(0);
		const violations: string[] = [];
		for (const file of files) {
			for (const specifier of importedSpecifiers(file.content)) {
				if (/^(?:\.\.\/)+.*packages\//.test(specifier) || /@axc\/[\w-]+\/src\//.test(specifier)) {
					violations.push(`${file.relativePath} imports ${specifier}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it('axc packages import mongoose only through persistence and service-mongoose', async () => {
		const files = await listFiles(axcDir, isProductionSource);
		const violations: string[] = [];
		for (const file of files) {
			const allowed = file.path.includes('/persistence/') || file.path.includes('/service-mongoose/');
			if (allowed) {
				continue;
			}
			for (const specifier of importedSpecifiers(file.content)) {
				if (specifier === 'mongoose' || specifier.startsWith('mongoose/') || specifier.startsWith('@cellix/mongoose-seedwork')) {
					violations.push(`${file.relativePath} imports ${specifier}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});
});

async function listTypeScriptFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return await listTypeScriptFiles(entryPath);
			}
			return entry.name.endsWith('.ts') ? [entryPath] : [];
		}),
	);
	return files.flat();
}
