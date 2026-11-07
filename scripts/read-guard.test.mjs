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

test('harness branch may run a shell', () => {
	process.env.AXC_GUARD_BRANCH = 'nrn-xai-4';
	try {
		assert.equal(sh('node --test scripts/read-guard.test.mjs'), undefined);
	} finally {
		process.env.AXC_GUARD_BRANCH = 'nrn-xai-4-a-out';
	}
});
