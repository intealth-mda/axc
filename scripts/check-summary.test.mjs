// node --test scripts/check-summary.test.mjs — check-log fixtures in the real tools' output formats.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { knipUnusedFiles, report, summarize } from './check-summary.mjs';

const root = path.resolve(import.meta.dirname, '..');
const log = [
	'packages/axc/rest/src/a.ts:1:8 lint/correctness/noUnusedImports  FIXABLE  ━━━━━━━━━━',
	'',
	'  ! This import is unused.',
	'packages/axc/rest/src/a.ts:2:8 lint/suspicious/useAwait ━━━━━━━━━━',
	'',
	'  × This async function lacks an await expression.',
	'Found 1 error.',
	"@axc/rest:typecheck: src/a.ts(3,10): error TS6133: 'x' is declared but its value is never read.",
	'@axc/rest:typecheck: [ELIFECYCLE] Command failed with exit code 2.',
	'@axc/application-services:test:  FAIL  src/b.test.ts > suite > adds up',
	'@axc/application-services:test: AssertionError: expected 1 to be 2 // Object.is equality',
	'$ knip --no-config-hints',
	'Unused exports (1)',
	'helper  packages/axc/rest/src/a.ts:9:14',
	'AC coverage failed: each AC id needs its own scenario. Missing:',
	'  X-AC2',
].join('\n');

test('one line per problem: file + rule/error id', () => {
	assert.deepEqual(summarize(log, root), [
		'biome (warn)  packages/axc/rest/src/a.ts:1:8 lint/correctness/noUnusedImports — This import is unused.',
		'biome  packages/axc/rest/src/a.ts:2:8 lint/suspicious/useAwait — drop `async` (return the value/Promise directly) or add a real await; This async function lacks an await expression.',
		'ts     packages/axc/rest/src/a.ts:3:10 TS6133 `x` — delete the unused declaration (parameter: prefix `_`)',
		'test   packages/axc/application-services/src/b.test.ts > suite > adds up — AssertionError: expected 1 to be 2 // Object.is equality',
		'knip   Unused exports: helper packages/axc/rest/src/a.ts:9:14 — drop `export`; keep it local',
		'ac     missing X-AC2',
	]);
});

test('a failure only under node_modules or packages/cellix is not given to the agent as a file to edit', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'check-summary-'));
	try {
		const file = path.join(dir, 'check.log');
		writeFileSync(
			file,
			"packages/cellix/serenity-framework/../../../node_modules/.pnpm/happy-dom@21.0.4/node_modules/happy-dom/lib/window/BrowserWindow.d.ts(692,67): error TS2694: Namespace '\"node:stream/web\"' has no exported member 'UnderlyingSource'.\n",
		);
		assert.match(report(file, root), /Do not open or edit those trees/);
		assert.equal(report(file, root).includes('BrowserWindow'), false);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
test('cli: header + summary; unrecognised failure falls back to the excerpt/tail', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'check-summary-'));
	try {
		const run = (text) => {
			const file = path.join(dir, 'check.log');
			writeFileSync(file, text);
			return execFileSync(process.execPath, [path.join(import.meta.dirname, 'check-summary.mjs'), file], { cwd: root, encoding: 'utf8' });
		};
		assert.match(run(log), /^check FAILED: 6 problem\(s\) — full log: .*check\.log\n/);
		assert.match(run('step one\nsomething odd happened\nlast line\n'), /last line/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
test('TS2883 (real tsgo output): line names the function + add explicit return type', () => {
	const lines = summarize(readFileSync(path.join(import.meta.dirname, 'fixtures/ts2883.log'), 'utf8'), root);
	assert.match(lines[0], /^ts {5}packages\/axc\/rest\/src\/zzprobe\.ts:3:14 TS2883 — add explicit return type to exported 'sendProbe' \(e\.g\. `: Response`\); The inferred type/);
	assert.match(lines[1], /'failProbe'/);
});
test('knip unused exports/types (real output): rows say drop export, keep local', () => {
	assert.deepEqual(summarize(readFileSync(path.join(import.meta.dirname, 'fixtures/knip-unused.log'), 'utf8'), root), [
		'knip   Unused exports: zzProbeUnused packages/axc/rest/src/zzprobe.ts:2:14 — drop `export`; keep it local',
		'knip   Unused exported types: ZzProbeLocal type packages/axc/rest/src/zzprobe.ts:1:13 — drop `export`; keep the type local',
	]);
});

test('useImportType and TS18048 lines carry a one-clause fix', () => {
	const hints = [
		'packages/axc/rest/src/a.ts:1:1 lint/style/useImportType  FIXABLE  ━━━━━━━━━━',
		'',
		'  × All these imports are only used as types.',
		"@axc/rest:typecheck: src/a.ts(4,7): error TS18048: 'x' is possibly 'undefined'.",
	].join('\n');
	assert.deepEqual(summarize(hints, root), [
		'biome  packages/axc/rest/src/a.ts:1:1 lint/style/useImportType — use `import type` for type-only imports; All these imports are only used as types.',
		"ts     packages/axc/rest/src/a.ts:4:7 TS18048 — narrow before use (if / `?.` / `??`); 'x' is possibly 'undefined'.",
	]);
});

test('TS6133 / TS6196 unused declarations: one line naming the identifier and the fix', () => {
	const log = ["@axc/rest:typecheck: src/a.steps.ts(3,7): error TS6133: 'expected' is declared but its value is never read.", "@axc/rest:typecheck: src/b.ts(1,6): error TS6196: 'Row' is declared but never used."].join('\n');
	assert.deepEqual(summarize(log, root), [
		'ts     packages/axc/rest/src/a.steps.ts:3:7 TS6133 `expected` — delete the unused declaration (parameter: prefix `_`)',
		'ts     packages/axc/rest/src/b.ts:1:6 TS6196 `Row` — delete the unused declaration (parameter: prefix `_`)',
	]);
});

test('a package cycle is the typecheck failure', () => {
	const text = [
		'$ node scripts/check-script-policy.mjs && pnpm run typecheck',
		'dependency script policy: ignore-scripts=true and allowBuilds does not enable dependency scripts',
		'✔ one line per problem: file + rule/error id (1ms)',
		'$ turbo run typecheck',
		' WARNING  Circular package dependency detected: @axc/rest, @axc/application-services',
		'  x Cyclic dependency detected:',
		'  | 	@axc/application-services#build, @axc/rest#build',
		'[ELIFECYCLE] Command failed with exit code 1.',
	].join('\n');
	const dir = mkdtempSync(path.join(tmpdir(), 'check-summary-'));
	try {
		const file = path.join(dir, 'check.log');
		writeFileSync(file, text);
		assert.deepEqual(summarize(text, root), [
			'cycle  @axc/rest, @axc/application-services — turbo stopped before typecheck. Remove the dependency that closes the cycle. A package must not depend on one that already depends on it.',
		]);
		const body = report(file, root);
		assert.match(body, /cycle {2}@axc\/rest, @axc\/application-services/);
		assert.equal(body.includes('dependency script policy'), false);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('a shape-required unused file is kept and named', () => {
	const log = ['Unused files (2)', 'packages/axc/domain/src/domain/contexts/catalog/course/course.repository.ts', 'packages/axc/persistence/src/models/course.model.ts'].join('\n');
	const lines = summarize(log, root);
	assert.match(lines[0], /course\.repository\.ts — house shape requires this file\. Knip reports it unused\. Import it from the aggregate\. Do not delete it\./);
	assert.match(lines[1], /course\.model\.ts$/);
	assert.equal(lines[1].includes('house shape'), false);
});

test('knip unused files are paths, and unused exports are not', () => {
	const log = ['Unused files (2)', 'packages/axc/persistence/src/models/course.model.ts', 'leftover  packages/axc/domain/src/course.visa.ts', 'Unused exports (1)', 'helper  packages/axc/rest/src/a.ts:9:14'].join('\n');
	assert.deepEqual(knipUnusedFiles(log), ['packages/axc/persistence/src/models/course.model.ts', 'packages/axc/domain/src/course.visa.ts']);
});

test('CLI runs when invoked through a symlinked path', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'mog-cs-link-'));
	try {
		symlinkSync(import.meta.dirname, path.join(dir, 'scripts'));
		writeFileSync(path.join(dir, 'check.log'), log);
		const out = execFileSync(process.execPath, [path.join(dir, 'scripts/check-summary.mjs'), path.join(dir, 'check.log')], { cwd: root, encoding: 'utf8' });
		assert.match(out, /^check FAILED: \d+ problem/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
