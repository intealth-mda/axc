import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { axcPackageDir } from '../support/package-scope.ts';
import { importedSpecifiers, isProductionSource, listFiles } from '../support/source-files.ts';

const srcDir = path.join(axcPackageDir('persistence'), 'src');

// axc keeps its data in memory (the base API has no database), so the shared
// CellixJS persistence and Mongoose model suites, which require MongoRepositoryBase,
// MongoUnitOfWork and Mongoose models, do not apply. These checks keep the same
// structure: write side under datasources/domain, read side under datasources/readonly.
describe('axc persistence conventions', () => {
	it('write-side folders contain a repository next to each unit of work', async () => {
		const violations: string[] = [];
		for (const file of await listFiles(path.join(srcDir, 'datasources/domain'), isProductionSource)) {
			if (!file.path.endsWith('.uow.ts')) {
				continue;
			}
			const base = path.basename(file.path, '.uow.ts');
			const siblings = await readdir(path.dirname(file.path));
			if (!siblings.includes(`${base}.repository.ts`)) {
				violations.push(`${file.relativePath} is missing ${base}.repository.ts`);
			}
		}
		expect(violations).toEqual([]);
	});

	it('read-side files do not expose write operations', async () => {
		const violations: string[] = [];
		for (const file of await listFiles(path.join(srcDir, 'datasources/readonly'), isProductionSource)) {
			if (/\.(?:create|insertMany|updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany|save)\s*\(/.test(file.content)) {
				violations.push(file.relativePath);
			}
		}
		expect(violations, 'readonly data sources must only query').toEqual([]);
	});

	it('read repositories return domain entity references', async () => {
		const violations: string[] = [];
		for (const file of await listFiles(path.join(srcDir, 'datasources/readonly'), isProductionSource)) {
			if (file.path.endsWith('.read-repository.ts') && !(importedSpecifiers(file.content).includes('@axc/domain') && /\w+EntityReference\b/.test(file.content))) {
				violations.push(file.relativePath);
			}
		}
		expect(violations, 'CellixJS read repositories return <Entity>EntityReference from the domain, not plain records').toEqual([]);
	});

	it('persistence does not import the delivery or application layers', async () => {
		const forbidden = ['hono', '@axc/rest', '@axc/application-services', '@apps/'];
		const violations: string[] = [];
		for (const file of await listFiles(srcDir, isProductionSource)) {
			for (const specifier of importedSpecifiers(file.content)) {
				if (forbidden.some((prefix) => specifier.startsWith(prefix))) {
					violations.push(`${file.relativePath} imports ${specifier}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});
});
