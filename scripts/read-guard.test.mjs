import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { check } from './read-guard.mjs';

const root = path.resolve(import.meta.dirname, '..');
const sh = (command) => check({ toolName: 'run_terminal_command', toolInput: { command } }, root);

test('shell may run a package test and may not read cellix, archunit, node_modules, or /tmp copies', () => {
	assert.equal(sh('pnpm --filter @axc/domain run test'), undefined);
	assert.equal(sh('pnpm exec biome check packages/axc/domain/src'), undefined);
	assert.equal(sh('pnpm exec turbo run test:arch'), undefined);
	assert.equal(sh('cd packages/axc/domain && ../../../node_modules/.bin/tsgo --noEmit'), undefined);
	assert.equal(sh('node scripts/stop-gate.mjs run'), undefined);
	assert.match(sh('python3 -c \'open("packages/cellix/archunit-tests/src/checks/domain-conventions.ts").read()\''), /packages\/cellix/);
	assert.match(sh('python3 -c \'print(open("packages/axc-verification/archunit-tests/src/checks/domain-conventions.ts").read())\''), /archunit-tests/);
	assert.match(sh('python3 -c \'print(open("node_modules/@serenity-js/core/package.json").read())\''), /node_modules/);
	assert.match(sh('python3 -c \'print(open("/tmp/axc-notes/domain.ts").read())\''), /\/tmp/);
	assert.match(sh('python3 -c \'print(open("scripts/read-allow.mjs").read())\''), /scripts\//);
});
