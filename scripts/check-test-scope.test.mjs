import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { archPackages, checkTestScope, scopeProblems } from './check-test-scope.mjs';

const root = path.resolve(import.meta.dirname, '..');
const node = "import { nodeConfig } from '@cellix/config-vitest';\nexport default nodeConfig;\n";
const files = (map) => (file) => map[file] ?? null;
const arch = 'vitest run --config vitest.arch.config.ts';

test('the repo keeps archunit-tests on test:arch only', () => {
	assert.deepEqual(checkTestScope(root), []);
	assert.ok(archPackages(root).includes('packages/axc/domain'));
});

test('a test script with no vitest config loads archunit-tests', () => {
	assert.match(scopeProblems('d', { test: 'vitest run --silent --reporter=dot src/domain', 'test:arch': arch })[0], /no vitest\.config\.ts/);
});

test('a test script or config that names the arch suite fails', () => {
	assert.match(scopeProblems('d', { test: 'vitest run src/archunit-tests', 'test:arch': arch }, files({ 'vitest.config.ts': node }))[0], /must not name archunit-tests/);
	assert.match(scopeProblems('d', { test: 'vitest run --config vitest.arch.config.ts', 'test:arch': arch })[0], /must not name/);
	assert.match(scopeProblems('d', { test: 'vitest run', 'test:arch': arch }, files({ 'vitest.config.ts': "import { archConfig } from '@cellix/config-vitest';\nexport default archConfig;\n" }))[0], /must exclude/);
	assert.match(scopeProblems('d', { test: 'vitest run', 'test:arch': 'vitest run' }, files({ 'vitest.config.ts': node }))[0], /test:arch must run the arch config/);
});

test('any path scope is fine when the config excludes archunit-tests', () => {
	for (const test of ['vitest run', 'vitest run --silent --reporter=dot --passWithNoTests', 'vitest run src/domain test']) {
		assert.deepEqual(scopeProblems('d', { test, 'test:arch': arch }, files({ 'vitest.config.ts': node })), [], test);
	}
	assert.deepEqual(scopeProblems('d', { 'test:arch': arch }), []);
});
