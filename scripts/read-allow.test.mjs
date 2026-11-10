import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { allows, extractPaths, shapeGaps } from './read-allow.mjs';

const roots = [];
const temp = () => {
	const root = mkdtempSync(path.join(tmpdir(), 'shape-'));
	roots.push(root);
	return root;
};
afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

test('a Stop report can name a Cellix architecture check', () => {
	const text = 'read packages/cellix/archunit-tests/src/checks/domain-conventions.ts and packages/cellix/domain-seedwork/src/index.ts';
	assert.deepEqual(extractPaths(text), ['packages/cellix/archunit-tests/src/checks/domain-conventions.ts']);
});

test('shape check is quiet until packages/axc source changes', () => {
	assert.deepEqual(shapeGaps(temp(), []), []);
});

test('shape check derives the aggregate from the folder the agent started', () => {
	const root = temp();
	const gaps = shapeGaps(root, ['packages/axc/domain/src/domain/catalog/course.ts']);
	assert.ok(gaps.some((gap) => gap.includes('contexts/<context>/<entity>/<entity>.aggregate.ts')));
	assert.ok(gaps.some((gap) => gap.startsWith('layers not touched:')));
	const partial = shapeGaps(root, ['packages/axc/domain/src/domain/contexts/catalog/course/course.ts']);
	assert.ok(partial.includes('packages/axc/domain/src/domain/contexts/catalog/course/course.aggregate.ts'));
	assert.ok(partial.some((gap) => gap.startsWith('packages/axc/domain/src/domain/contexts/catalog/course/course.aggregate.test.ts') && gap.includes('beside the aggregate')));
});

test('a complete generic aggregate is not a shape gap', () => {
	const root = temp();
	const base = 'packages/axc/domain/src/domain/contexts/billing/invoice/';
	const files = ['invoice.aggregate.ts', 'invoice.value-objects.ts', 'invoice.repository.ts', 'index.ts', 'invoice.aggregate.test.ts'].map((name) => base + name);
	for (const file of files) {
		mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
		writeFileSync(path.join(root, file), 'export {}\n');
	}
	const changed = [...files, 'packages/axc/persistence/src/datasources/invoice.ts', 'packages/axc/application-services/src/contexts/billing/invoice/index.ts', 'packages/axc/rest/src/invoice.ts'];
	assert.deepEqual(shapeGaps(root, changed), []);
});

test('persistence and application-service files outside their folders are named', () => {
	const gaps = shapeGaps(temp(), [
		'packages/axc/persistence/src/invoice.ts',
		'packages/axc/application-services/src/invoice.ts',
		'packages/axc/domain/src/domain/contexts/billing/invoice/invoice.aggregate.ts',
		'packages/axc/rest/src/invoice.ts',
	]);
	assert.ok(gaps.some((gap) => gap.includes('src/datasources or src/models')));
	assert.ok(gaps.some((gap) => gap.includes('src/contexts')));
});

test('repo map: every full path it names, braces expanded, exists and is open to the read guard', () => {
	const root = path.resolve(import.meta.dirname, '..');
	const map = readFileSync(path.join(root, '.agents/skills/axc-repo-map/SKILL.md'), 'utf8');
	const expand = (p) => {
		const m = p.match(/\{([^}]+)\}/);
		return m ? m[1].split(',').flatMap((part) => expand(p.replace(m[0], part))) : [p];
	};
	const cited = /`((?:packages|apps)\/[^`<>*\s]+\.(?:ts|md|json)|task-set-[ab]-requirements\.md)`/g;
	const named = [...map.matchAll(cited)].flatMap((m) => expand(m[1]));
	assert.ok(named.length >= 15, `map names ${named.length} paths`);
	for (const file of named) {
		assert.ok(existsSync(path.join(root, file)), `missing: ${file}`);
		assert.ok(allows(file), `closed: ${file}`);
	}
});

test('repo map: seedwork imports are real subpath exports and satisfy the Cellix aggregate check', () => {
	const root = path.resolve(import.meta.dirname, '..');
	const map = readFileSync(path.join(root, '.agents/skills/axc-repo-map/SKILL.md'), 'utf8');
	const exportsMap = JSON.parse(readFileSync(path.join(root, 'packages/cellix/domain-seedwork/package.json'), 'utf8')).exports;
	assert.equal(exportsMap['.'], undefined, 'the map says seedwork has no root export');
	const subpaths = [...map.matchAll(/@cellix\/domain-seedwork\/([\w-]+)/g)].map((m) => m[1]);
	for (const sub of [...subpaths, 'repository', 'unit-of-work']) assert.ok(exportsMap[`./${sub}`], `not exported: ${sub}`);
	assert.ok(map.includes('`/repository`') && map.includes('`/unit-of-work`'));

	// The aggregate check (vendored from Cellix) requires these imports. If it changes, revisit the map's Passport/Visa line.
	const check = readFileSync(path.join(root, 'packages/cellix/archunit-tests/src/checks/domain-conventions.ts'), 'utf8');
	for (const rule of ['/extends\\s+DomainSeedwork\\.AggregateRoot</', '/import.*Passport.*from.*passport/', '/Visa.*from/', '/\\.entity\\.ts/']) assert.ok(check.includes(rule), rule);
	const sample = [
		"import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';",
		"import type { Visa } from '@cellix/domain-seedwork/visa';",
		"import type { CatalogPassport } from '../catalog.passport.ts';",
		"import type { CourseProps } from './course.entity.ts';",
		'export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CatalogPassport> {}',
	].join('\n');
	assert.match(sample, /extends\s+DomainSeedwork\.AggregateRoot</);
	assert.match(sample, /import.*Passport.*from.*passport/);
	assert.match(sample, /Visa.*from/);
	assert.ok(map.includes("import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root'"));
	assert.ok(map.includes('<context>.passport.ts`') && map.includes('seedwork `Visa`'));
});
