// What may enter the transcript. scripts/check-budget.mjs re-exports this file.
// A closed tree is a path prefix. A quoted word and an exclude glob are not a path.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path, { relative, resolve, sep } from 'node:path';

const HEAVY = [/(?:^|\s)pnpm(?:\s+(?:--\S+(?:\s+\S+)?|run))*\s+(?:verify|check|test(?::acceptance|:arch)?)(?:\s|$)/];

export const CLOSED_TREES = ['node_modules', 'packages/cellix', 'agent-transcripts', 'dist'];

export const OPEN_ROOTS = 'packages/axc, packages/axc-verification, apps/api/src, apps/docs';

export const HEAVY_MESSAGE = 'Run that command through pnpm run agent-check so its log stays out of the chat. Example: pnpm run agent-check -- pnpm run verify';

export const BROAD_MESSAGE = 'That glob covers a whole tree. Name a directory and a filename, for example packages/axc/rest/src/**/*.ts.';

export const WIDE_SHELL_MESSAGE = 'Read one file. A multi-file dump stays in the transcript for the rest of the run.';

export const TAIL_MESSAGE = 'agent-check already prints the error block. Do not pipe that command to tail.';

export const QUERY_COMMAND = 'pnpm --filter @cellix/generator query -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --route <route> --transport rest';

const TREE = /(?:^|[/\\\s`'"(=])((?:node_modules|packages\/cellix|dist|agent-transcripts))(?=$|[/\\\s`'"),\];])/g;

export function isWrapped(text) {
	return text.includes('agent-check');
}

/** verify, check, and the full test scripts. Their logs are the cache. A tail pipe is refused even when wrapped. */
export function heavyCommandReason(text) {
	if (tailPipeReason(text) !== undefined) return TAIL_MESSAGE;
	if (isWrapped(text)) return undefined;
	if (HEAVY.some((pattern) => pattern.test(text))) return HEAVY_MESSAGE;
	return undefined;
}

/** agent-check is the tail. Piping the check back into the transcript keeps the log. */
export function tailPipeReason(text) {
	if (typeof text !== 'string' || !/\|\s*tail\b/.test(text)) return undefined;
	if (/\b(?:agent-check|verify|check|test(?::acceptance|:arch)?|lint:cellix)\b/.test(text)) return TAIL_MESSAGE;
	return undefined;
}

/** A glob with no filename. **\/*.ts stays allowed. */
export function broadGlobReason(pattern) {
	if (typeof pattern !== 'string' || pattern.length === 0) return undefined;
	const normalized = pattern.replaceAll('\\', '/');
	if (normalized === '*' || normalized === '**' || normalized === '**/*') return BROAD_MESSAGE;
	if (/(?:^|\/)\*\*\/\*$/.test(normalized) || /(?:^|\/)\*\*$/.test(normalized)) return BROAD_MESSAGE;
	return undefined;
}

export function wideShellReason(text) {
	const dumps = text.match(/\b(?:cat|head|tail)\b/g);
	if (dumps && dumps.length > 2) return WIDE_SHELL_MESSAGE;
	if (/\bfind\b/.test(text) && /\b(?:cat|head|tail)\b/.test(text)) return WIDE_SHELL_MESSAGE;
	if (/\bwhile\b/.test(text) && /\bread\b/.test(text) && /\b(?:cat|head|tail)\b/.test(text)) return WIDE_SHELL_MESSAGE;
	if (/\bxargs\b/.test(text) && /\b(?:cat|head|tail)\b/.test(text)) return WIDE_SHELL_MESSAGE;
	if (/\bfind\b/.test(text) && !text.includes('-name') && !text.includes('-path')) return WIDE_SHELL_MESSAGE;
	return undefined;
}

/**
 * A closed tree is a path segment: node_modules, packages/cellix, dist, or agent-transcripts.
 * "dist" inside quotes is file text. An exclude glob such as !**\/dist/** is not an open of that tree.
 */
export function closedReferenceInText(value) {
	if (typeof value !== 'string' || value.length === 0) return undefined;
	TREE.lastIndex = 0;
	for (const match of value.matchAll(TREE)) {
		const tree = match[1];
		if (tree === undefined) continue;
		const start = match.index + match[0].length - tree.length;
		const before = value.slice(Math.max(0, start - 12), start);
		if (before.includes('!')) continue;
		const quote = value[start - 1];
		let end = start + tree.length;
		while (end < value.length && !/[\s`'"),\];|&]/.test(value[end])) end += 1;
		const bare = end === start + tree.length;
		if (bare && (quote === '"' || quote === "'" || quote === '`') && value[end] === quote) continue;
		return value.slice(start, end).replace(/\/+$/, '');
	}
	return undefined;
}

/** A closed path may be opened when the newest check log names that file. */
export function logAllowsPath(log, blockedReference) {
	const normalized = blockedReference.replaceAll('\\', '/');
	const leaf = normalized.slice(normalized.lastIndexOf('/') + 1);
	if (!normalized.includes('/') || !leaf.includes('.')) return false;
	if (log.includes(normalized)) return true;
	const parts = normalized.split('/');
	for (let start = 1; start <= parts.length - 3; start++) {
		const suffix = parts.slice(start).join('/');
		if (log.includes(suffix)) return true;
	}
	return false;
}

const STOP = 'Stop. That path stays closed. A failing check names the next file.';

/** True when the log names this file, or names a file that imports it. */
export function logAllowsReference(log, blockedReference, workspace) {
	const absolute = resolve(workspace, blockedReference).replaceAll('\\', '/');
	const relativePath = relative(workspace, absolute).split(sep).join('/');
	if (logAllowsPath(log, blockedReference) || logAllowsPath(log, absolute) || logAllowsPath(log, relativePath)) return true;
	return importedByLoggedFile(log, relativePath, workspace);
}

/** True when the newest agent-check log names this file, or a file that imports it. */
export function logNames(blockedReference, cwd) {
	const logPath = newestCheckLog();
	if (logPath === undefined) return false;
	const workspace = cwd ?? process.cwd();
	const log = readFileSync(logPath, 'utf8').replaceAll('\\', '/');
	return logAllowsReference(log, blockedReference, workspace);
}

const MENTIONED_FILE = /(?:^|[\s'"(])([^\s'"):]+\.(?:ts|tsx|js|mjs|graphql))(?=\(|[\s'"):,]|$)/g;
const IMPORT_SPECIFIER = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g;

function importedByLoggedFile(log, candidate, workspace) {
	for (const named of filesMentioned(log, workspace)) {
		let source;
		try {
			source = readFileSync(named, 'utf8');
		} catch {
			continue;
		}
		for (const spec of importSpecifiers(source)) {
			if (resolveImport(named, spec, workspace).some((file) => sameFile(file, candidate, workspace))) return true;
		}
	}
	return false;
}

function filesMentioned(log, workspace) {
	const found = [];
	MENTIONED_FILE.lastIndex = 0;
	for (const match of log.matchAll(MENTIONED_FILE)) {
		const token = match[1];
		if (token === undefined || token.includes('node_modules')) continue;
		const located = locateMention(token, workspace);
		if (located !== undefined && !found.includes(located)) found.push(located);
	}
	return found;
}

function locateMention(token, workspace) {
	const absolute = token.startsWith('/') ? token : resolve(workspace, token);
	if (isFile(absolute)) return absolute;
	const config = lintConfig(workspace);
	for (const layer of Object.values(config?.layers ?? {})) {
		if (typeof layer !== 'string') continue;
		const candidate = resolve(workspace, layer, token);
		if (isFile(candidate)) return candidate;
	}
	return undefined;
}

function importSpecifiers(source) {
	const specs = [];
	IMPORT_SPECIFIER.lastIndex = 0;
	for (const match of source.matchAll(IMPORT_SPECIFIER)) {
		if (match[1] !== undefined) specs.push(match[1]);
	}
	return specs;
}

function resolveImport(fromFile, spec, workspace) {
	if (spec.startsWith('.')) return resolveRelative(fromFile, spec);
	return resolvePackage(spec, workspace);
}

function resolveRelative(fromFile, spec) {
	const base = resolve(path.dirname(fromFile), spec);
	const swapped = spec.endsWith('.js') ? `${base.slice(0, -3)}.ts` : undefined;
	return [base, swapped, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')].filter((file) => file !== undefined && isFile(file));
}

function resolvePackage(spec, workspace) {
	const config = lintConfig(workspace);
	const scope = config?.scope;
	if (typeof scope !== 'string' || !spec.startsWith(`${scope}/`)) return [];
	const rest = spec.slice(scope.length + 1);
	for (const layer of Object.values(config.layers ?? {})) {
		if (typeof layer !== 'string') continue;
		const packageDir = layer.replace(/\/src$/, '');
		const packageName = packageDir.split('/').pop();
		if (rest !== packageName && !rest.startsWith(`${packageName}/`)) continue;
		const sub = rest === packageName ? 'index.ts' : rest.slice(packageName.length + 1).replace(/^src\//, '');
		const withExtension = sub.endsWith('.ts') || sub.endsWith('.js') ? sub : `${sub}.ts`;
		return [resolve(workspace, layer, withExtension), resolve(workspace, packageDir, withExtension)].filter((file) => isFile(file));
	}
	return [];
}

function sameFile(file, candidate, workspace) {
	const left = relative(workspace, file).split(sep).join('/');
	return left === candidate || left === candidate.replace(/^\.\//, '');
}

function isFile(file) {
	try {
		return statSync(file).isFile();
	} catch {
		return false;
	}
}

function lintConfig(workspace) {
	try {
		for (const file of ['factory.json', '.cellix/factory.json']) {
			try {
				return JSON.parse(readFileSync(resolve(workspace, file), 'utf8'));
			} catch {
				// Try the next factory location.
			}
		}
		return undefined;
	} catch {
		return undefined;
	}
}

/** Count one repeated denial or command. The third attempt is the stop. */
export function noteRepeat(root, agentId, key) {
	const file = path.join(root, '.cellix', 'budget', `${agentId}.json`);
	const counts = readCounts(file);
	const next = (counts[key] ?? 0) + 1;
	counts[key] = next;
	mkdirSync(path.dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(counts)}\n`);
	return next;
}

export function repeatMessage(count, message) {
	return count > 2 ? STOP : message;
}

export function commandCap(_root, _agentId, _command) {
	return undefined;
}

function newestCheckLog() {
	let newest;
	let entries = [];
	try {
		entries = readdirSync(tmpdir(), { withFileTypes: true });
	} catch {
		return undefined;
	}
	for (const entry of entries) {
		if (!entry.isDirectory() || !entry.name.startsWith('cellix-agent-check-')) continue;
		const logPath = resolve(tmpdir(), entry.name, 'command.log');
		try {
			const modified = statSync(logPath).mtimeMs;
			if (newest === undefined || modified > newest.modified) newest = { path: logPath, modified };
		} catch {
			// An unfinished check has no log yet.
		}
	}
	return newest?.path;
}

function readCounts(file) {
	try {
		const parsed = JSON.parse(readFileSync(file, 'utf8'));
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
