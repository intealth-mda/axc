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
	assert.ok(named.length >= 20, `map names ${named.length} paths`);
	for (const file of named) {
		assert.ok(existsSync(path.join(root, file)), `missing: ${file}`);
		assert.ok(allows(file), `closed: ${file}`);
	}
});
