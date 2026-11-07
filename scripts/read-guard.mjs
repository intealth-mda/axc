// PreToolUse read budget. Product source is readable. Cellix, archunit, node_modules, and scripts are not.
// The shell is closed on an output branch. The Stop hook verifies. Dependency-free. A thrown hook fails open.
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { allows, currentBranch, harnessBranch, readableFile, readNamed, sessionKey, stopLog } from './read-allow.mjs';

const READ_TOOLS = new Set(['read_file', 'read', 'grep', 'list_dir']);
const SHELL_TOOLS = new Set(['run_terminal_command', 'bash', 'shell', 'execute']);

const rel = (root, file) => path.relative(root, path.resolve(root, file)).split(path.sep).join('/');

function named(root, input) {
	const git = spawnSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: root, encoding: 'utf8' });
	if (git.status !== 0) return [];
	return readNamed(readableFile(git.stdout.trim(), sessionKey(input)));
}

function deny(file) {
	const text = String(file);
	if (text.includes('archunit-tests')) {
		return `BLOCKED (read-budget): ${file}. Read the check under packages/cellix/archunit-tests/src/checks/ or packages/axc-verification/archunit-tests/src/checks/. Do not copy those tests.`;
	}
	if (text.includes('packages/cellix') || text.includes('cellixjs')) {
		return `BLOCKED (read-budget): ${file}. That file is not a framework contract. Read the domain-seedwork and mongo-repository files the repo map names.`;
	}
	return `BLOCKED (read-budget): ${file}. That tree is closed. The API is in the repo map. Open a file only when the map, the health slice, the task spec, or a Stop report names its path.`;
}

function shellRead() {
	return 'BLOCKED (read-budget): shell. Do not run a shell command. Write the slice and stop.';
}

export function check(input, root, extra = []) {
	const tool = String(input.toolName ?? input.tool_name ?? '').toLowerCase();
	const args = input.toolInput ?? input.tool_input ?? {};
	const allowed = (file) => allows(rel(root, file), extra);
	if (SHELL_TOOLS.has(tool)) return harnessBranch(currentBranch(root)) ? undefined : shellRead();
	if (!READ_TOOLS.has(tool)) return undefined;
	if (tool === 'grep') {
		const pattern = String(args.pattern ?? '');
		if (pattern === '' || pattern === '.' || pattern === '.*') return deny('grep');
		if (typeof args.path === 'string' && stopLog(args.path)) return undefined;
		if (typeof args.path !== 'string' || !args.path || !allowed(args.path)) return deny(args.path || 'grep');
		return undefined;
	}
	const target = args.target_file ?? args.file_path ?? args.target_directory ?? args.path ?? args.file;
	if (typeof target === 'string' && stopLog(target)) return undefined;
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
