// PreToolUse read budget. Until a Stop block names a file, only the repo-map list may be read.
// Dependency-free. A thrown hook fails open. A missing session still enforces the map list.
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { allows, readableFile, readNamed, sessionKey } from './read-allow.mjs';

const READ_TOOLS = new Set(['read_file', 'read', 'grep']);
const SHELL_TOOLS = new Set(['run_terminal_command', 'bash', 'shell', 'execute']);
const READ_BINS = new Set(['rg', 'grep', 'egrep', 'fgrep', 'find', 'ls', 'cat', 'head', 'tail', 'less', 'bat', 'tree', 'nl', 'wc']);
const FLAG_WITH_VALUE = new Set(['-e', '-f', '-m', '-g', '--glob', '-n', '-c', '-A', '-B', '-C']);

const rel = (root, file) => path.relative(root, path.resolve(root, file)).split(path.sep).join('/');

function named(root, input) {
	const git = spawnSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: root, encoding: 'utf8' });
	if (git.status !== 0) return [];
	return readNamed(readableFile(git.stdout.trim(), sessionKey(input)));
}

function deny(file) {
	return `BLOCKED (read-budget): ${file}. Read only the repo-map list until a Stop block names a file.`;
}

function positionals(argv) {
	const out = [];
	for (let i = 1; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--') continue;
		if (arg.startsWith('-')) {
			if (FLAG_WITH_VALUE.has(arg)) i++;
			continue;
		}
		out.push(arg);
	}
	return out;
}

/** Trees the agent was reading to discover rules the repo map already states. `node_modules/.bin` stays runnable. */
export function closedRead(command) {
	if (/packages\/cellix(?:\/|$)/.test(command)) return deny('packages/cellix');
	if (/node_modules(?!\/\.bin\b)/.test(command)) return deny('node_modules');
	if (/archunit-tests/.test(command)) return deny('archunit-tests');
	if (/\/tmp(?:\/|\s|$)/.test(command)) return deny('/tmp');
	if (/(?:^|[\s"'`=])(?:\.\/)?scripts\/(?!stop-gate\.mjs\b)/.test(command)) return deny('scripts/');
	return undefined;
}

/** Deny a shell read outside the budget. Writes and other commands are left to the write guard. */
export function shellRead(command, allowed) {
	const closed = closedRead(command);
	if (closed) return closed;
	const parts = command.split(/\n|&&|\|\||;|\|/);
	for (const part of parts) {
		const argv = part
			.trim()
			.split(/\s+/)
			.filter((arg) => arg && arg !== '>' && arg !== '<' && !arg.startsWith('>'));
		const bin = argv[0]?.split('/').pop();
		if (!bin || !READ_BINS.has(bin)) continue;
		const args = positionals(argv);
		const paths = /^(rg|grep|egrep|fgrep)$/.test(bin) ? args.filter((arg) => arg.includes('/') || arg === '.' || arg === '*') : args;
		if (!paths.length || args[0] === '.' || args[0] === '.*') return deny(bin);
		for (const file of paths) {
			if (file === '.' || file === '..' || file === '*' || !allowed(file.replace(/^\.\//, ''))) return deny(file);
		}
	}
	return undefined;
}

export function check(input, root, extra = []) {
	const tool = String(input.toolName ?? input.tool_name ?? '').toLowerCase();
	const args = input.toolInput ?? input.tool_input ?? {};
	const allowed = (file) => allows(rel(root, file), extra);
	if (SHELL_TOOLS.has(tool)) return shellRead(String(args.command ?? ''), (file) => allows(file.replace(/^\.\//, ''), extra));
	if (!READ_TOOLS.has(tool)) return undefined;
	if (tool === 'grep') {
		const pattern = String(args.pattern ?? '');
		if (pattern === '' || pattern === '.' || pattern === '.*') return deny('grep');
		if (typeof args.path !== 'string' || !args.path || !allowed(args.path)) return deny(args.path || 'grep');
		return undefined;
	}
	const target = args.target_file ?? args.file_path ?? args.path ?? args.file;
	if (typeof target !== 'string' || !target || !allowed(target)) return deny(target || 'read_file');
	return undefined;
}

const isMain = () => Boolean(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (isMain()) {
	try {
		const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
		const root = input.workspaceRoot ?? process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
		const reason = check(input, root, named(root, input));
		if (reason) {
			process.stdout.write(JSON.stringify({ decision: 'deny', reason, hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
		}
	} catch {
		// fail open
	}
}
