import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const wrapper = fileURLToPath(new URL('./verify-quiet.mjs', import.meta.url));

function run(body) {
	const directory = mkdtempSync(path.join(tmpdir(), 'verify-quiet-test-'));
	const executable = path.join(directory, 'pnpm');
	if (body) {
		writeFileSync(executable, `#!${process.execPath}\n${body}`);
		chmodSync(executable, 0o700);
	}
	const child = spawn(process.execPath, [wrapper], { env: { ...process.env, PATH: directory } });
	let output = '';
	child.stdout.on('data', (data) => {
		output += data;
	});
	child.stderr.on('data', (data) => {
		output += data;
	});
	return { child, result: once(child, 'close').then(([code, signal]) => ({ code, signal, output })) };
}

test('runs the exact gate and retains large stdout and stderr without console flooding', async () => {
	const { result } = run(`const fs = require('node:fs');
if (JSON.stringify(process.argv.slice(2)) !== '["run","verify"]') process.exit(9);
fs.writeSync(1, 'x'.repeat(2_000_000)); fs.writeSync(2, 'diagnostic');`);
	const { code, output } = await result;
	assert.equal(code, 0);
	assert.ok(output.length < 1000);
	const log = output.match(/full log: (.+)/)[1];
	assert.equal(readFileSync(log, 'utf8'), 'x'.repeat(2_000_000) + 'diagnostic');
});

test('preserves a failed gate exit and complete diagnostics', async () => {
	const { code, output } = await run("console.error('stage failed'); process.exit(7);").result;
	assert.equal(code, 7);
	assert.match(output, /exit=7/);
	assert.match(readFileSync(output.match(/full log: (.+)/)[1], 'utf8'), /stage failed/);
});

test('a missing pnpm is a failure, not a pass', async () => {
	const { code, output } = await run().result;
	assert.equal(code, 1);
	assert.match(output, /could not start/);
});

test('forwards interruption and preserves signal termination', { skip: process.platform === 'win32', timeout: 10000 }, async () => {
	const ready = path.join(mkdtempSync(path.join(tmpdir(), 'verify-ready-')), 'ready');
	const { child, result } = run(`require('node:fs').writeFileSync(${JSON.stringify(ready)}, 'ready'); setInterval(() => {}, 1000);`);
	const { existsSync } = await import('node:fs');
	while (!existsSync(ready) && child.exitCode === null) await new Promise((resolve) => setTimeout(resolve, 20));
	child.kill('SIGTERM');
	const { code, signal, output } = await result;
	assert.equal(code, null);
	assert.equal(signal, 'SIGTERM');
	assert.match(output, /signal=SIGTERM/);
});
