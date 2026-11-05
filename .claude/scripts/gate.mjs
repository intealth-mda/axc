#!/usr/bin/env node
// Compact quality gate. Runs checks and prints one line per step, plus only the error lines of a failing step.
//
//   node .claude/scripts/gate.mjs            fast gate: changed files and affected packages only
//   node .claude/scripts/gate.mjs --full     every step of `pnpm run verify`, read from package.json
//   node .claude/scripts/gate.mjs --base <ref>   compare against <ref> instead of the session base (default HEAD)
//
// Exit code 0 when every step passes, 1 otherwise. Stops at the first failing step, like `&&` in `verify`.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim() || process.cwd();
const MAX_ERROR_LINES = 40;
const BIOME_EXTENSIONS = /\.(?:[cm]?[jt]sx?|json|jsonc|css)$/;
const ERROR_LINE = /(error|fail|✗|×|expected|received|assert|TS\d{4}|not ok|unhandled|cannot find|is not assignable|vulnerab|severity|━━━)/i;
// Stack frames inside node_modules or Node internals, and blank lines. Error lines that merely mention a node_modules path are kept.
// Turbo prefixes each line with `<pkg>:<task>: `, so a frame can start after that prefix.
const NOISE_LINE = /(?:^|: )\s*at (?:.*node_modules[\\/]|node:|async |processTicksAndRejections)|^\s*$|^\S+:\S+:\s*$/;

function git(args) {
	const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
	return result.status === 0 ? result.stdout : '';
}

export function sessionBase() {
	const file = join(ROOT, '.agents-work', 'session', 'latest.json');
	if (!existsSync(file)) return 'HEAD';
	try {
		const base = JSON.parse(readFileSync(file, 'utf8')).base;
		return typeof base === 'string' && git(['cat-file', '-t', base]).trim() === 'commit' ? base : 'HEAD';
	} catch {
		return 'HEAD';
	}
}

/** Files changed since `base`, committed or not, plus untracked files. Paths are repo-relative. Excludes `.agents-work/`. */
export function changedFiles(base) {
	const tracked = git(['diff', '--name-only', base]).split('\n');
	const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n');
	return [...new Set([...tracked, ...untracked])].filter((file) => file && !file.startsWith('.agents-work/'));
}

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

export function errorLines(output) {
	const lines = stripAnsi(output).split('\n');
	const matches = lines.filter((line) => ERROR_LINE.test(line) && !NOISE_LINE.test(line));
	const picked = matches.length > 0 ? matches : lines.filter((line) => !NOISE_LINE.test(line)).slice(-25);
	const unique = [...new Set(picked.map((line) => line.trimEnd()))];
	const shown = unique.slice(0, MAX_ERROR_LINES);
	if (unique.length > shown.length) shown.push(`... ${unique.length - shown.length} more error lines`);
	return shown;
}

// Steps copied from the `verify` script call package binaries (biome, knip) directly, as `pnpm run` would, so they need node_modules/.bin on PATH.
const STEP_ENV = { ...process.env, FORCE_COLOR: '0', CI: '1', PATH: [join(ROOT, 'node_modules', '.bin'), process.env.PATH].filter(Boolean).join(delimiter) };

function runStep(name, command) {
	const started = Date.now();
	const result = spawnSync('sh', ['-c', command], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: STEP_ENV });
	const seconds = ((Date.now() - started) / 1000).toFixed(0);
	const ok = result.status === 0;
	const lines = [`${ok ? 'PASS' : 'FAIL'} ${name} (${seconds}s)`];
	if (!ok) lines.push(...errorLines(`${result.stdout ?? ''}\n${result.stderr ?? ''}`).map((line) => `  ${line}`));
	return { ok, lines };
}

export function fastSteps(base, files) {
	const steps = [];
	const vendored = files.filter((file) => file.startsWith('packages/cellix/'));
	if (vendored.length > 0) steps.push({ name: 'vendored cellix unchanged', fail: `packages/cellix/** must not drift from upstream. Changed: ${vendored.join(', ')}` });
	const lintable = files.filter((file) => BIOME_EXTENSIONS.test(file) && existsSync(join(ROOT, file)));
	if (lintable.length > 0) steps.push({ name: `biome check (${lintable.length} files)`, command: `pnpm exec biome check --no-errors-on-unmatched ${lintable.map((file) => `'${file}'`).join(' ')}` });
	const touchesCode = files.some((file) => /^(?:apps|packages)\//.test(file));
	if (touchesCode) {
		steps.push({ name: 'typecheck + unit tests (affected packages)', command: `pnpm exec turbo run typecheck test --filter='...[${base}]' --output-logs=errors-only` });
		steps.push({ name: 'architecture tests', command: 'pnpm run test:arch' });
	}
	return steps;
}

export function fullSteps() {
	const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
	return pkg.scripts.verify.split(' && ').map((command) => ({ name: command, command }));
}

export function runGate({ full = false, base = sessionBase() } = {}) {
	const steps = full ? fullSteps() : fastSteps(base, changedFiles(base));
	if (steps.length === 0) return { ok: true, report: 'PASS gate: no changed files to check' };
	const report = [];
	for (const step of steps) {
		if (step.fail) {
			report.push(`FAIL ${step.name}`, `  ${step.fail}`);
			return { ok: false, report: report.join('\n') };
		}
		const { ok, lines } = runStep(step.name, step.command);
		report.push(...lines);
		if (!ok) return { ok: false, report: report.join('\n') };
	}
	return { ok: true, report: report.join('\n') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const args = process.argv.slice(2);
	const baseIndex = args.indexOf('--base');
	const { ok, report } = runGate({ full: args.includes('--full'), base: baseIndex >= 0 ? args[baseIndex + 1] : sessionBase() });
	console.log(report);
	process.exit(ok ? 0 : 1);
}
