// Stop hook: before the top-level agent ends its turn, check what this session changed.
//
// - No changed files under apps/ or packages/ (a question-and-answer turn): exits at once, adding nothing.
// - The same changes already passed: exits at once (cached by a content hash of the diff).
// - Otherwise: auto-formats the changed files with biome, runs the fast gate (.claude/scripts/gate.mjs),
//   and blocks the stop with a compact report if it fails, so the agent fixes the problem before finishing.
// - The same failure twice in a row: lets the agent stop and tells the user, instead of looping.
//
// The full `pnpm run verify` still runs in the pre-commit hook. Turn this off with AXC_STOP_GATE=off.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BLOCKS_PER_FAILURE = 2;
const MAX_BLOCKS_PER_SESSION = 6;

if (process.env.AXC_STOP_GATE === 'off') process.exit(0);

let input = {};
try {
	input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
	process.exit(0);
}

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const { changedFiles, runGate, sessionBase } = await import('../scripts/gate.mjs');

const base = sessionBase();
const relevant = (files) => files.filter((file) => /^(?:apps|packages)\//.test(file));
let files = changedFiles(base);
if (relevant(files).length === 0) process.exit(0);

const stateDir = join(root, '.agents-work', 'session');
mkdirSync(stateDir, { recursive: true });
const stateFile = join(stateDir, `${input.session_id ?? 'unknown'}-gate.json`);
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const saveState = () => writeFileSync(stateFile, `${JSON.stringify(state, null, '\t')}\n`);

function fingerprint() {
	const hash = createHash('sha256').update(base);
	hash.update(spawnSync('git', ['diff', base], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).stdout ?? '');
	for (const file of files.sort()) {
		const path = join(root, file);
		hash.update(file);
		if (existsSync(path)) hash.update(readFileSync(path));
	}
	return hash.digest('hex');
}

if (fingerprint() === state.lastPass) process.exit(0);

// Auto-fix formatting and import order first, so the agent never spends a turn on them.
const lintable = files.filter((file) => /\.(?:[cm]?[jt]sx?|json|jsonc|css)$/.test(file) && existsSync(join(root, file)));
if (lintable.length > 0) spawnSync('pnpm', ['exec', 'biome', 'check', '--write', '--no-errors-on-unmatched', ...lintable], { cwd: root, encoding: 'utf8' });
files = changedFiles(base);

const print = fingerprint();
if (print === state.lastPass) process.exit(0);

const { ok, report } = runGate({ base });
if (ok) {
	Object.assign(state, { lastPass: print, lastFail: undefined, failCount: 0 });
	saveState();
	process.exit(0);
}

state.failCount = print === state.lastFail ? (state.failCount ?? 0) + 1 : 1;
state.lastFail = print;
state.totalBlocks = (state.totalBlocks ?? 0) + 1;
saveState();

if (state.failCount > MAX_BLOCKS_PER_FAILURE || state.totalBlocks > MAX_BLOCKS_PER_SESSION) {
	process.stdout.write(`${JSON.stringify({ systemMessage: `Stop gate: still failing after repeated attempts; stopping so a person can decide.\n${report}` })}\n`);
	process.exit(0);
}

process.stderr.write(`Stop gate failed. Fix these before finishing (attempt ${state.failCount} of ${MAX_BLOCKS_PER_FAILURE}). If the failure is expected, for example a TDD red phase, say so and stop.\n${report}\n`);
process.exit(2);
