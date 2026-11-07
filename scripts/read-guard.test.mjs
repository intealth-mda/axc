import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { check } from './read-guard.mjs';

process.env.AXC_GUARD_BRANCH = 'nrn-xai-4-a-out';
const root = path.resolve(import.meta.dirname, '..');
const sh = (command) => check({ toolName: 'run_terminal_command', toolInput: { command } }, root);

test('shell is denied, including node reads of package source', () => {
	for (const command of [
		'pnpm --filter @axc/domain run test',
		'pnpm exec biome check packages/axc/domain/src',
		'pnpm exec turbo run test:arch',
		'cd packages/axc/domain && ../../../node_modules/.bin/tsgo --noEmit',
		'node scripts/stop-gate.mjs run',
		'ls',
		`node -e "require('fs').readFileSync('packages/axc/domain/src/index.ts','utf8')"`,
		`python3 -c 'open("packages/cellix/archunit-tests/src/checks/domain-conventions.ts").read()'`,
	]) {
		assert.match(sh(command), /Do not run a shell command/, command);
	}
});

test('product source is readable and discovery trees are not', () => {
	const read = (target_file) => check({ toolName: 'read_file', toolInput: { target_file } }, root);
	assert.equal(read('packages/axc/domain/src/index.ts'), undefined);
	assert.equal(read('packages/axc/persistence/src/index.ts'), undefined);
	assert.equal(read('packages/axc/service-mongoose/src/index.ts'), undefined);
	assert.equal(read('packages/axc/domain/package.json'), undefined);
	assert.equal(read('packages/axc-verification/acceptance-api/src/step-definitions/healthcheck.steps.ts'), undefined);
	assert.equal(read('packages/cellix/domain-seedwork/src/domain-seedwork/aggregate-root.ts'), undefined);
	assert.equal(read('packages/cellix/domain-seedwork/src/domain-seedwork/repository.ts'), undefined);
	assert.equal(read('packages/cellix/mongoose-seedwork/src/mongoose-seedwork/mongo-repository.ts'), undefined);
	assert.match(read('packages/cellix/package.json'), /framework contract/);
	assert.match(read('packages/cellix/domain-seedwork/src/domain-seedwork/aggregate-root.test.ts'), /framework contract/);
	assert.equal(read('packages/cellix/package.json').includes('compiler error'), false);
	const list = (target_directory) => check({ toolName: 'list_dir', toolInput: { target_directory } }, root);
	assert.equal(list('packages/axc/domain'), undefined);
	assert.match(list('packages/cellix'), /framework contract/);
	assert.match(list('packages/cellix/domain-seedwork/src/domain-seedwork'), /framework contract/);
	assert.match(list('/Volumes/files/src/cellixjs'), /framework contract/);
	assert.match(list(''), /closed/);
	assert.match(read('packages/axc-verification/archunit-tests/src/x.ts'), /closed/);
	assert.match(read('node_modules/@cellix/domain-seedwork/package.json'), /closed/);
	assert.match(read('scripts/read-allow.mjs'), /closed/);
});

test('harness branch may run a shell', () => {
	process.env.AXC_GUARD_BRANCH = 'nrn-xai-4';
	try {
		assert.equal(sh('node --test scripts/read-guard.test.mjs'), undefined);
	} finally {
		process.env.AXC_GUARD_BRANCH = 'nrn-xai-4-a-out';
	}
});
