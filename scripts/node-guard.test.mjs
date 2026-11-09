// node --test scripts/node-guard.test.mjs — pin parsing, the pure check, and the CLI exit code.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { nodeProblem, requiredMajor } from './node-guard.mjs';

const cli = (cwd, ...args) => spawnSync(process.execPath, [path.join(import.meta.dirname, 'node-guard.mjs'), ...args], { cwd, encoding: 'utf8' });

test('requiredMajor: reads .nvmrc forms; none or junk → null', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'node-guard-'));
	try {
		assert.equal(requiredMajor(dir), null);
		for (const [pin, major] of [
			['24.21.0\n', 24],
			['v24', 24],
			['22.1', 22],
			['lts/*', null],
		]) {
			writeFileSync(path.join(dir, '.nvmrc'), pin);
			assert.equal(requiredMajor(dir), major, pin);
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
test('nodeProblem: same major ok; other major or no node → message with the nvm fix; no pin → ok', () => {
	assert.equal(nodeProblem('v24.21.0', 24), null);
	assert.equal(nodeProblem('v24.0.0\n', 24), null);
	assert.equal(nodeProblem('v20.19.3', null), null);
	assert.match(nodeProblem('v20.19.3', 24), /^Node v20\.19\.3 is active; this repo needs Node 24 \(\.nvmrc\)\. Fix: `nvm install 24 && nvm use 24`/);
	assert.match(nodeProblem('v25.1.0', 24), /needs Node 24/);
	assert.match(nodeProblem('', 24), /^Node \(not found\) is active/);
});
test('cli: exit 1 + message on a mismatch, silent exit 0 on a match (pin from the cwd .nvmrc)', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'node-guard-'));
	try {
		writeFileSync(path.join(dir, '.nvmrc'), '24.21.0\n');
		const bad = cli(dir, 'v20.19.3');
		assert.equal(bad.status, 1);
		assert.match(bad.stderr, /Node v20\.19\.3 is active; this repo needs Node 24/);
		const good = cli(dir, 'v24.21.0');
		assert.equal(good.status, 0);
		assert.equal(good.stderr, '');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
