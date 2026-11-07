import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { shapeGaps } from './read-allow.mjs';

const roots = [];
const temp = () => {
	const root = mkdtempSync(path.join(tmpdir(), 'shape-'));
	roots.push(root);
	return root;
};
afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
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
