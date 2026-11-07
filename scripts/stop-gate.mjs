// Agent Stop gate (Grok Build / Claude / Codex / Cursor-compatible hook JSON; also a CLI for tools without a Stop hook).
// The agent only writes code; this hook installs, verifies and commits. Dependency-free; fails open.
//   start: record HEAD + tree fingerprint once per session (SessionStart; UserPromptSubmit fallback).
//   stop:  nothing changed since start → allow (pure Q&A). Changes → `pnpm install` (frozen unless a
//          package.json dependency changed, in which case `pnpm install --offline` refreshes the lockfile;
//          a refresh that moves an already-resolved version is restored and blocked), auto-fix
//          (scripts/auto-fix.mjs: useAwait, knip exports/types, biome safe fixes; never tests), then `git add` the
//          write dirs + `git commit` with husky ON: its pre-commit runs the one full `pnpm run verify`.
//          Green (verify log ends with `verify ok`, tree clean) → silent allow. Red → block with a terse
//          one-line-per-problem report; nothing committed. The fingerprint covers untracked file contents. A plain
//          re-stop on the same tree state is allowed; a stopHookActive retry after a block always re-verifies.
//          At most 6 blocks per session; then allow with a one-line note. A green commit is pushed;
//          an output branch (`-a-out` / `-b-out`) gets a PR when `gh` is available. On an output branch, a changed
//          tree that misses the generic Cellix shape blocks before verify, and the cited paths become readable. A pre-existing Snyk/audit
//          failure (no package.json edit) ends the turn instead of asking for a repair. Auto-fix log lines survive a failed commit
//          (`<git dir>/stop-gate/auto-fix-log.json`, untracked): the next auto-commit body still lists them; cleared on commit.
//   run:   the same for tools without a Stop hook: report + exit 1 on failure, one `verify ok` line on success.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { autoFix, changedFiles, fixTargets } from './auto-fix.mjs';
import { report } from './check-summary.mjs';
import { isOutputBranch, readableFile, rememberPaths, securityEnd, sessionKey, shapeGaps } from './read-allow.mjs';

const MAX_BLOCKS = 6;
const NVM = 'export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 && nvm use >/dev/null 2>&1; ';
const run = (cmd, args, env = process.env, input = undefined) => spawnSync(cmd, args, { encoding: 'utf8', env, input, maxBuffer: 64 << 20 });
const git = (...args) => {
	const r = run('git', args);
	if (r.status !== 0) throw new Error(`git ${args[0]} failed`);
	return r.stdout;
};

function readInput() {
	try {
		return JSON.parse(readFileSync(0, 'utf8') || '{}');
	} catch {
		return {};
	}
}

/** HEAD + tree fingerprint (status, tracked diff, untracked file contents). Read-only: hash-object without -w. */
export function snapshot() {
	const status = git('status', '--porcelain', '-uall');
	const untracked = git('ls-files', '-o', '--exclude-standard', '-z')
		.split('\0')
		.filter((f) => f && !f.endsWith('/') && !f.includes('\n')); // nested repos / odd names: status still covers the name
	const blobs = untracked.length ? (run('git', ['hash-object', '--stdin-paths'], process.env, untracked.join('\n')).stdout ?? '') : '';
	const fingerprint = createHash('sha1').update(status).update(git('diff', 'HEAD')).update(blobs).digest('hex');
	return { head: git('rev-parse', 'HEAD').trim(), dirty: status.trim() !== '', fingerprint };
}

const tmp = () => process.env.TMPDIR ?? tmpdir();
const verifyLog = (root) => path.join(tmp(), `axc-verify-${path.basename(root)}.log`);
const fresh = (file, since) => existsSync(file) && statSync(file).mtimeMs >= since;

/** True when the verify log was written since `since` and ends with husky's `verify ok` summary line. */
function verifyFinished(root, since) {
	const log = verifyLog(root);
	return fresh(log, since) && /^verify ok\b/.test(readFileSync(log, 'utf8').trimEnd().split('\n').at(-1) ?? '');
}

const CAP_NOTE = `Stop allowed — block cap (${MAX_BLOCKS}) reached; last failure left uncommitted.`;

/** What to do at Stop: 'allow' | 'commit' | { block } | { note } (allow with a one-line note). Pure, for tests. */
export function plan(start, now, { verified = true, active = false } = {}) {
	const retry = active && start.last === 'block'; // the agent is answering our block: re-verify whatever the fingerprint says
	if (start.blocks >= MAX_BLOCKS) return retry ? { note: CAP_NOTE } : 'allow';
	if ((retry && now.dirty) || (start.needsPublish && now.dirty)) return 'commit';
	if (start.needsPublish && !now.dirty) return 'publish';
	if (start.lastBlocked === `${now.head}:${now.fingerprint}`) return 'allow';
	if (now.head === start.head && now.fingerprint === start.fingerprint) return 'allow';
	if (now.dirty) return 'commit';
	return verified ? 'allow' : { block: 'Committed, but no `verify ok` summary in the verify log: verify did not run or finish. Leave committing to the Stop hook.' };
}

/** path_deny patterns from the shared write boundary (protected files: never auto-fixed). */
function denyRules(root) {
	try {
		return JSON.parse(readFileSync(path.join(root, '.github/hooks/write-boundary.json'), 'utf8')).path_deny.map(([re]) => new RegExp(re));
	} catch {
		return [];
	}
}

/** Writable dirs from the shared write boundary (`dir/**` globs, minus dot-dirs); empty → whole tree. */
function writeDirs(root) {
	try {
		const rules = JSON.parse(readFileSync(path.join(root, '.github/hooks/write-boundary.json'), 'utf8'));
		return rules.allowed_write_globs
			.filter((g) => g.endsWith('/**') && !g.startsWith('.'))
			.map((g) => g.slice(0, -3))
			.filter((d) => existsSync(path.join(root, d)));
	} catch {
		return [];
	}
}

/** Generic message from `git diff --cached --name-status` lines: subject names the features and areas touched. */
export function commitMessage(nameStatus, pkgOf = (f) => f.split('/').slice(0, -1).at(-1) ?? f) {
	const files = nameStatus
		.split('\n')
		.filter(Boolean)
		.map((l) => {
			const [st, ...rest] = l.split('\t');
			return { st: st[0], file: rest.at(-1) };
		});
	const stem = (f) => path.basename(f).split('.')[0];
	const generic = new Set(['index', 'README', 'package', 'tsconfig', 'sidebars', 'questions', 'world']);
	const stems = (st) => [...new Set(files.filter((f) => st.includes(f.st)).map((f) => stem(f.file)))];
	const pick = (st) => stems(st).filter((n) => !generic.has(n));
	const added = pick('A');
	const names = (added.length ? added : pick('MRD').length ? pick('MRD') : stems('AMRD')).slice(0, 3);
	const areas = [...new Set(files.map((f) => pkgOf(f.file)))].slice(0, 5);
	const verb = added.length ? 'add' : files.every((f) => f.st === 'D') ? 'remove' : 'update';
	const subject = `${added.length ? 'feat' : 'chore'}: ${verb} ${names.join(', ') || `${files.length} file(s)`}${areas.length ? ` (${areas.join(', ')})` : ''}`;
	const list = files.slice(0, 20).map((f) => `${f.st} ${f.file}`);
	if (files.length > 20) list.push(`… +${files.length - 20} more`);
	return [subject, `Auto-committed by the Stop hook after a green husky verify.\n\n${list.join('\n')}`];
}

// husky 9.1 install, minus its `git config core.hooksPath` write: the hook list, stub and deprecation shim it generates.
const HUSKY_HOOKS = 'pre-commit pre-merge-commit prepare-commit-msg commit-msg post-commit applypatch-msg pre-applypatch post-applypatch pre-rebase post-rewrite post-checkout post-merge pre-push pre-auto-gc'.split(' ');
const HUSKY_SH = `echo "husky - DEPRECATED\n\nPlease remove the following two lines from $0:\n\n#!/usr/bin/env sh\n. \\"\\$(dirname -- \\"\\$0\\")/_/husky.sh\\"\n\nThey WILL FAIL in v10.0.0\n"`;

/** Repo uses husky (`.husky/pre-commit`): make sure `.husky/_` exists, generating it like husky's install would but
 * writing no git config (a fresh worktree has none: it is gitignored). Returns true when husky hooks are usable. */
export function ensureHuskyHooks(root) {
	if (!existsSync(path.join(root, '.husky/pre-commit'))) return false;
	const _ = (x = '') => path.join(root, '.husky/_', x);
	if (existsSync(_('h'))) return true;
	const runner = path.join(root, 'node_modules/husky/husky');
	if (!existsSync(runner)) return false;
	rmSync(_('husky.sh'), { force: true });
	mkdirSync(_(), { recursive: true });
	writeFileSync(_('.gitignore'), '*');
	copyFileSync(runner, _('h'));
	for (const h of HUSKY_HOOKS) writeFileSync(_(h), '#!/usr/bin/env sh\n. "$(dirname "$0")/h"', { mode: 0o755 });
	writeFileSync(_('husky.sh'), HUSKY_SH);
	return true;
}

const block = (lines) => `Stop blocked — nothing committed. Fix, then stop again (no verify/commit calls):\n${lines}`;

/** Env for the auto-commit: husky ON (its pre-commit IS the verify), including Snyk. */
export function commitEnv(base = process.env) {
	const env = { ...base };
	delete env.HUSKY;
	delete env.SNYK_SKIP;
	return env;
}

/**
 * Auto-fix lines from earlier failed stops + this one, deduped, each `fixer: files` line limited to the staged files
 * (a later edit may have reverted a fixed file). Pure.
 */
export function mergeFixLog(prior, fixes, staged) {
	const files = new Set(
		staged
			.split('\n')
			.map((l) => l.split('\t').at(-1)?.trim())
			.filter(Boolean),
	);
	const out = [];
	for (const line of [...prior, ...fixes]) {
		const m = line.match(/^([^:]+): (.+)$/);
		const kept = m
			? `${m[1]}: ${m[2]
					.split(', ')
					.filter((f) => files.has(f))
					.join(', ')}`
			: line;
		if (m && kept.endsWith(': ')) continue;
		if (!out.includes(kept)) out.push(kept);
	}
	return out;
}

const fixLogFile = () => path.join(git('rev-parse', '--absolute-git-dir').trim(), 'stop-gate', 'auto-fix-log.json');
const readFixLog = (file) => {
	try {
		const v = JSON.parse(readFileSync(file, 'utf8'));
		return Array.isArray(v) ? v.filter((l) => typeof l === 'string') : [];
	} catch {
		return [];
	}
};

const packageJsonChanged = () => changedPackageJsons().length > 0;

const changedPackageJsons = () =>
	git('status', '--porcelain', '-uall')
		.split('\n')
		.map((line) => line.slice(3).trim())
		.filter((file) => file && /(^|\/)package\.json$/.test(file) && !file.includes('node_modules/'));

/** A new or changed dependency spec. `workspace:*` and `catalog:` stay inside the repo. */
export function dependencyViolations(before = {}, after = {}) {
	const bad = [];
	const ok = /^(?:workspace:\*|catalog:(?:[\w.-]+)?)$/;
	for (const kind of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
		const prev = before[kind] ?? {};
		for (const [name, spec] of Object.entries(after[kind] ?? {})) {
			if (prev[name] === spec) continue;
			if (typeof spec !== 'string' || !ok.test(spec)) bad.push(`${kind} ${name}@${spec}`);
		}
	}
	return bad;
}

/** Importer dependency resolutions (`importer bucket dep` → version). A new key is fine; a changed value is drift. */
export function lockfileVersionDrifts(before, after) {
	const prior = importerVersions(before);
	const next = importerVersions(after);
	const drifts = [];
	for (const [key, version] of prior) {
		const now = next.get(key);
		if (now !== undefined && now !== version) drifts.push(`${key}: ${version} -> ${now}`);
	}
	return drifts;
}

function importerVersions(yaml) {
	const map = new Map();
	let section = '';
	let importer = '';
	let bucket = '';
	let dep = '';
	for (const line of String(yaml).split(/\r?\n/)) {
		if (line === 'importers:') {
			section = 'importers';
			continue;
		}
		if (section === 'importers' && /^(?:packages|snapshots):$/.test(line)) break;
		if (section !== 'importers') continue;
		if (/^  \S/.test(line)) {
			importer = line.trim().replace(/:$/, '');
			bucket = '';
			dep = '';
			continue;
		}
		if (/^    [^ ].*:\s*$/.test(line)) {
			bucket = line.trim().replace(/:$/, '');
			dep = '';
			continue;
		}
		const named = line.match(/^      ([^:]+):\s*$/);
		if (named) {
			dep = named[1].replaceAll(/['"]/g, '');
			continue;
		}
		const version = line.match(/^        version: (.+)$/);
		if (version && importer && bucket && dep) map.set(`${importer} ${bucket} ${dep}`, version[1].trim());
	}
	return map;
}

function packageJsonViolations(root) {
	const bad = [];
	for (const file of changedPackageJsons()) {
		let before = {};
		const shown = run('git', ['show', `HEAD:${file}`]);
		if (shown.status === 0 && shown.stdout.trim()) {
			try {
				before = JSON.parse(shown.stdout);
			} catch {
				bad.push(`${file} (HEAD is not JSON)`);
				continue;
			}
		}
		let after;
		try {
			after = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
		} catch {
			bad.push(`${file} (not JSON)`);
			continue;
		}
		bad.push(...dependencyViolations(before, after).map((item) => `${file}: ${item}`));
	}
	return bad;
}

/** install → add → commit (husky verify). Returns null on success, a block string, or `{ end }` for a pre-existing security finding. */
export function autoCommit(root) {
	const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
	if (isOutputBranch(branch)) {
		const gaps = shapeGaps(root);
		if (gaps.length) return block(gaps.join('\n'));
	}
	const t0 = Date.now();
	const env = commitEnv();
	const out = path.join(tmp(), `axc-stop-${path.basename(root)}.log`);
	if (existsSync(path.join(root, 'pnpm-lock.yaml'))) {
		const depsChanged = packageJsonChanged();
		if (depsChanged) {
			const bad = packageJsonViolations(root);
			if (bad.length) return block(`A dependency must be workspace:* or catalog:. Prefer a dependency the package already has.\n${bad.join('\n')}`);
		}
		const lockPath = path.join(root, 'pnpm-lock.yaml');
		const beforeLock = depsChanged ? readFileSync(lockPath, 'utf8') : '';
		const install = depsChanged ? 'pnpm install --offline' : 'pnpm install --frozen-lockfile';
		const i = run('sh', ['-c', `${NVM}${install}`], { ...env, HUSKY: '0' }); // HUSKY=0: no hooksPath rewrite
		if (i.status !== 0) {
			if (depsChanged) writeFileSync(lockPath, beforeLock);
			writeFileSync(out, `${i.stdout}${i.stderr}`);
			const store = depsChanged ? ' A new dependency must already be in the workspace store as workspace:* or catalog:.' : '';
			return block(`${install} failed.${store}\n${report(out, root)}`);
		}
		if (depsChanged) {
			const drifts = lockfileVersionDrifts(beforeLock, readFileSync(lockPath, 'utf8'));
			if (drifts.length) {
				writeFileSync(lockPath, beforeLock);
				run('sh', ['-c', `${NVM}pnpm install --offline --frozen-lockfile`], { ...env, HUSKY: '0' });
				return block(`The lockfile refresh moved an existing version. Those versions stay. Do not edit pnpm-lock.yaml, node_modules, or packages/cellix.\n${drifts.slice(0, 15).join('\n')}`);
			}
		}
	}
	const dirs = writeDirs(root);
	const fixed = autoFix(root, fixTargets(changedFiles(root), { dirs, deny: denyRules(root) }), { prefix: NVM, env: { ...env, HUSKY: '0' } });
	const logFile = fixLogFile();
	const prior = readFixLog(logFile);
	if (fixed.length) {
		mkdirSync(path.dirname(logFile), { recursive: true });
		writeFileSync(logFile, JSON.stringify([...prior, ...fixed.filter((l) => !prior.includes(l))])); // kept until a commit lands
	}
	git('add', '-A', '--', ...(dirs.length ? dirs : ['.']));
	if (existsSync(path.join(root, 'pnpm-lock.yaml'))) git('add', '--', 'pnpm-lock.yaml');
	const staged = git('diff', '--cached', '--name-status');
	const fixes = mergeFixLog(prior, fixed, staged);
	if (!staged.trim()) return block(`changes outside the write dirs (${dirs.join(', ')}); revert them:\n${git('status', '--porcelain').trim().split('\n').slice(0, 10).join('\n')}`);
	const pkgOf = (f) => {
		for (let d = path.dirname(f); d !== '.' && d !== '/'; d = path.dirname(d)) if (existsSync(path.join(root, d, 'package.json'))) return path.basename(d);
		return f.split('/')[0];
	};
	const [subject, msg] = commitMessage(staged, pkgOf);
	const body = fixes.length ? `${msg}\n\nAuto-fix (Stop hook, before verify):\n${fixes.map((l) => `- ${l}`).join('\n')}` : msg;
	// Per-invocation hooksPath (not a config write), so the husky pre-commit runs even where core.hooksPath is unset.
	const hooks = ensureHuskyHooks(root) ? '-c core.hooksPath=.husky/_ ' : '';
	const c = run('sh', ['-c', `${NVM}git ${hooks}commit -q -m "$1" -m "$2"`, 'commit', subject, body], env);
	writeFileSync(out, `${c.stdout}${c.stderr}${fresh(verifyLog(root), t0) ? readFileSync(verifyLog(root), 'utf8') : ''}`);
	if (c.status !== 0) {
		run('git', ['reset', '-q']); // unstage only; the working tree stays as written
		const logText = readFileSync(out, 'utf8');
		const end = securityEnd(logText, packageJsonChanged(), root);
		if (end) return { end };
		return block(report(out, root));
	}
	rmSync(logFile, { force: true });
	if (!verifyFinished(root, t0)) return block('commit landed without a `verify ok` summary: husky verify did not run (core.hooksPath?).');
	const left = git('status', '--porcelain').trim();
	return left ? block(`committed, but changes outside the write dirs remain; revert them:\n${left.split('\n').slice(0, 10).join('\n')}`) : null;
}

/** After a green commit: push, and open the output-branch PR. No origin (tests, local-only) → no-op. */
function publish() {
	const remotes = run('git', ['remote']).stdout ?? '';
	if (!remotes.split('\n').some((name) => name.trim() === 'origin')) return null;
	const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
	const pushed = run('git', ['push', '-u', 'origin', 'HEAD']);
	if (pushed.status !== 0) return `Stop blocked — committed, push failed:\n${`${pushed.stderr ?? ''}${pushed.stdout ?? ''}`.slice(0, 400)}`;
	const match = branch.match(/^(.*)-[ab]-out$/);
	if (!match) return null;
	const base = match[1];
	const listed = run('gh', ['pr', 'list', '--head', branch, '--json', 'number']);
	if (listed.status !== 0) return `Stop blocked — committed, pull request failed:\n${`${listed.stderr ?? ''}${listed.stdout ?? ''}`.slice(0, 400)}`;
	if (listed.stdout.trim() !== '[]') return null;
	const created = run('gh', ['pr', 'create', '--base', base, '--head', branch, '--title', branch, '--body', 'Task output.']);
	if (created.status !== 0) return `Stop blocked — committed, pull request failed:\n${`${created.stderr ?? ''}${created.stdout ?? ''}`.slice(0, 400)}`;
	return null;
}

function main() {
	const [mode] = process.argv.slice(2);
	const root = git('rev-parse', '--show-toplevel').trim();
	process.chdir(root);
	if (mode === 'run') {
		const dirty = Boolean(git('status', '--porcelain').trim());
		const produced = dirty ? autoCommit(root) : null;
		if (produced && typeof produced === 'object') {
			console.log(produced.end);
			process.exit(1);
		}
		const reason = produced ?? (dirty ? publish() : null);
		if (reason) {
			console.log(reason);
			process.exit(1);
		}
		console.log(`${existsSync(verifyLog(root)) ? (readFileSync(verifyLog(root), 'utf8').trimEnd().split('\n').at(-1) ?? 'ok') : 'nothing to commit'} · ${git('rev-parse', '--short', 'HEAD').trim()}`);
		return;
	}
	const input = readInput();
	const id = sessionKey(input);
	const gitDir = git('rev-parse', '--absolute-git-dir').trim();
	const file = path.join(gitDir, 'stop-gate', `${id}.json`);
	if (mode === 'start') {
		if (existsSync(file)) return;
		mkdirSync(path.dirname(file), { recursive: true });
		writeFileSync(file, JSON.stringify({ ...snapshot(), at: Date.now(), blocks: 0 }));
		writeFileSync(readableFile(gitDir, id), '');
		return;
	}
	if (mode !== 'stop' || !existsSync(file)) return;
	const start = JSON.parse(readFileSync(file, 'utf8'));
	const active = Boolean(input.stopHookActive ?? input.stop_hook_active);
	const step = plan(start, snapshot(), { verified: verifyFinished(root, start.at), active });
	if (typeof step === 'object' && step.note) {
		process.stdout.write(JSON.stringify({ systemMessage: step.note }));
		return;
	}
	const produced = step === 'commit' ? autoCommit(root) : step === 'publish' ? publish() : typeof step === 'object' ? step.block : null;
	if (produced && typeof produced === 'object') {
		const now = snapshot();
		writeFileSync(file, JSON.stringify({ ...start, last: 'allow', lastBlocked: `${now.head}:${now.fingerprint}` }));
		process.stdout.write(JSON.stringify({ systemMessage: produced.end }));
		return;
	}
	const reason = produced ?? null;
	if (!reason) {
		if (start.last === 'block' || start.needsPublish) writeFileSync(file, JSON.stringify({ ...start, last: 'allow', needsPublish: false }));
		return;
	}
	const now = snapshot();
	rememberPaths(readableFile(gitDir, id), reason);
	writeFileSync(file, JSON.stringify({ ...start, blocks: start.blocks + 1, last: 'block', needsPublish: reason.includes('committed,'), lastBlocked: `${now.head}:${now.fingerprint}` }));
	process.stdout.write(JSON.stringify({ decision: 'block', reason }));
}

// realpath + file URL: a symlinked (macOS /tmp, /var) or space-containing path must still run main, not no-op.
const isMain = () => Boolean(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (isMain()) {
	try {
		main();
	} catch {
		// fail open
	}
}
