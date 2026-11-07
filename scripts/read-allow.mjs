// Shared read budget and output-branch shape check. The repo map names the only files a task
// agent may read until a Stop block names another path. Dependency-free.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { summarize } from './check-summary.mjs';

export const MAP_FILES = [
	'.agents/skills/axc-repo-map/SKILL.md',
	'task-set-a-requirements.md',
	'task-set-b-requirements.md',
	'packages/axc/rest/src/index.ts',
	'apps/api/src/index.ts',
	'packages/axc/application-services/src/index.ts',
	'packages/axc-verification/acceptance-api/src/step-definitions/healthcheck.steps.ts',
];

export const COURSE_FILES = [
	'packages/axc/domain/src/domain/contexts/catalog/course/course.aggregate.ts',
	'packages/axc/domain/src/domain/contexts/catalog/course/course.value-objects.ts',
	'packages/axc/domain/src/domain/contexts/catalog/course/course.repository.ts',
];

const PERSISTENCE_PREFIXES = ['packages/axc/persistence/src/', 'packages/axc/service-mongoose/src/'];

export function sessionKey(input = {}, env = process.env) {
	return String(input.sessionId ?? input.session_id ?? input.conversation_id ?? env.GROK_SESSION_ID ?? 'default').replace(/[^\w.-]/g, '_');
}

export function readableFile(gitDir, id) {
	return path.join(gitDir, 'stop-gate', `${id}-readable.txt`);
}

export function readNamed(file) {
	try {
		return readFileSync(file, 'utf8')
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
	} catch {
		return [];
	}
}

/** Repo-relative paths cited in a Stop report. Line/column suffixes are stripped. Cellix paths are not remembered. */
export function extractPaths(text) {
	const out = new Set();
	const re = /(?:^|[\s`'"(])((?:packages|apps|task-set-[\w.-]+\.md|\.agents)\/[A-Za-z0-9_./@+-]+)/g;
	for (const match of text.matchAll(re)) {
		const cited = match[1].replace(/[),.;]+$/, '').replace(/:\d+(?::\d+)?$/, '');
		if (/^packages\/cellix(\/|$)/.test(cited)) continue;
		out.add(cited);
	}
	return [...out];
}

export function rememberPaths(file, text) {
	const found = extractPaths(text).filter((cited) => !readNamed(file).includes(cited));
	if (!found.length) return [];
	mkdirSync(path.dirname(file), { recursive: true });
	appendFileSync(file, `${found.join('\n')}\n`);
	return found;
}

export function allows(relPath, named = []) {
	const normalized = relPath.replace(/^\.\//, '');
	if (MAP_FILES.includes(normalized)) return true;
	return named.some((entry) => (entry.endsWith('/') ? normalized.startsWith(entry) : normalized === entry));
}

export function isOutputBranch(name) {
	return /-[ab]-out$/.test(name);
}

function walk(dir, acc) {
	let entries = [];
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, acc);
		else acc.push(full);
	}
}

function hasSeedArray(text) {
	return /\[[^[\]]*(?:\n[^[\]]*){15,}\]/.test(text);
}

/** Missing Cellix catalog files on an output branch. Empty when the shape is present. Paths only. */
export function shapeGaps(root) {
	const gaps = COURSE_FILES.filter((file) => !existsSync(path.join(root, file)));
	const adapters = [];
	for (const prefix of PERSISTENCE_PREFIXES) {
		const files = [];
		walk(path.join(root, prefix), files);
		for (const file of files) {
			const rel = path.relative(root, file).split(path.sep).join('/');
			if (rel.endsWith('/index.ts') || rel.endsWith('.test.ts')) continue;
			if (/course/i.test(path.basename(rel))) adapters.push(rel);
		}
	}
	if (!adapters.length) gaps.push(PERSISTENCE_PREFIXES[0]);
	const sources = [];
	walk(path.join(root, 'packages/axc/application-services/src'), sources);
	for (const file of sources) {
		const rel = path.relative(root, file).split(path.sep).join('/');
		if (!rel.endsWith('.ts') || rel.endsWith('.test.ts')) continue;
		let text = '';
		try {
			text = readFileSync(file, 'utf8');
		} catch {
			continue;
		}
		if (hasSeedArray(text)) gaps.push(rel);
	}
	return gaps;
}

/** A verify log whose only failure is a security gate, and the agent did not edit a package.json. */
export function securityEnd(log, packageJsonChanged, root = process.cwd()) {
	if (packageJsonChanged || !log || summarize(log, root).length) return null;
	if (!/vulnerable path|SNYK-|Tested \d+ projects|npm audit/i.test(log)) return null;
	return 'Stop allowed — pre-existing security finding. Do not edit .snyk, package manifests, or packages/cellix.';
}
