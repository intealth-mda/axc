// Shared read budget and output-branch shape check. Product source is readable. Discovery trees
// (Cellix, archunit, node_modules, scripts) are not. Dependency-free.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

const LAYERS = ['domain', 'persistence', 'application-services', 'rest'];
const AGGREGATE_FILES = (entity) => [`${entity}.aggregate.ts`, `${entity}.value-objects.ts`, `${entity}.repository.ts`, 'index.ts', `${entity}.aggregate.test.ts`];

export function sessionKey(input = {}, env = process.env) {
	return String(input.sessionId ?? input.session_id ?? input.conversation_id ?? env.GROK_SESSION_ID ?? 'default').replace(/[^\w.-]/g, '_');
}

export function readableFile(gitDir, id) {
	return path.join(gitDir, 'stop-gate', `${id}-readable.txt`);
}

/** A Stop verify log written by this hook. Other paths outside the repo stay closed. */
export function stopLog(file) {
	const base = path.basename(String(file));
	if (!/^axc-(?:verify|stop)-.+\.log$/.test(base)) return false;
	const tmp = (process.env.TMPDIR ?? tmpdir()).replace(/\/+$/, '');
	const abs = path.resolve(String(file));
	return abs.startsWith(`${tmp}/`);
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
		if (/^packages\/cellix(\/|$)/.test(cited) && !cited.includes('/archunit-tests/')) continue;
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

/** Vendored framework contracts. Every other packages/cellix file stays closed. */
export const CELLIX_CONTRACTS = [
	'packages/cellix/domain-seedwork/src/domain-seedwork/aggregate-root.ts',
	'packages/cellix/domain-seedwork/src/domain-seedwork/domain-entity.ts',
	'packages/cellix/domain-seedwork/src/domain-seedwork/repository.ts',
	'packages/cellix/domain-seedwork/src/domain-seedwork/value-object.ts',
	'packages/cellix/domain-seedwork/src/domain-seedwork/unit-of-work.ts',
	'packages/cellix/mongoose-seedwork/src/mongoose-seedwork/mongo-repository.ts',
	'packages/cellix/domain-seedwork/src/passport-seedwork/visa.ts',
];

/** Architecture checks the Stop report points at. Not the graphql, frontend, or metrics suites. */
const ARCH_CHECKS = [
	'packages/cellix/archunit-tests/src/domain.ts',
	'packages/cellix/archunit-tests/src/persistence.ts',
	'packages/cellix/archunit-tests/src/application-services.ts',
	'packages/cellix/archunit-tests/src/checks/domain-conventions.ts',
	'packages/cellix/archunit-tests/src/checks/persistence-conventions.ts',
	'packages/cellix/archunit-tests/src/checks/application-services-conventions.ts',
	'packages/cellix/archunit-tests/src/test-suites/domain-conventions.ts',
	'packages/cellix/archunit-tests/src/test-suites/persistence-conventions.ts',
	'packages/cellix/archunit-tests/src/test-suites/application-services-conventions.ts',
	'packages/axc-verification/archunit-tests/src/domain.ts',
	'packages/axc-verification/archunit-tests/src/persistence.ts',
	'packages/axc-verification/archunit-tests/src/application-services.ts',
	'packages/axc-verification/archunit-tests/src/checks/domain-conventions.ts',
	'packages/axc-verification/archunit-tests/src/checks/persistence-conventions.ts',
	'packages/axc-verification/archunit-tests/src/checks/application-services-conventions.ts',
	'packages/axc-verification/archunit-tests/src/test-suites/domain-conventions.ts',
	'packages/axc-verification/archunit-tests/src/test-suites/persistence-conventions.ts',
	'packages/axc-verification/archunit-tests/src/test-suites/application-services-conventions.ts',
	'packages/axc-verification/archunit-tests/src/utils/source-files.ts',
];

function archPath(normalized) {
	if (/^packages\/axc\/[^/]+\/src\/archunit-tests\//.test(normalized)) return true;
	if (normalized.includes('/archunit-tests/') || normalized.endsWith('/archunit-tests')) return true;
	return ARCH_CHECKS.includes(normalized);
}

function namedPath(normalized, named) {
	return named.some((entry) => (entry.endsWith('/') ? normalized.startsWith(entry) : normalized === entry));
}

function closed(normalized) {
	if (CELLIX_CONTRACTS.includes(normalized)) return false;
	if (normalized === 'packages/cellix' || normalized.startsWith('packages/cellix/')) return true;
	if (normalized === 'node_modules' || normalized.startsWith('node_modules/')) return true;
	if (normalized === 'scripts' || normalized.startsWith('scripts/')) return true;
	if (normalized.includes('/archunit-tests/') || normalized.endsWith('/archunit-tests')) return true;
	return false;
}

export function allows(relPath, named = []) {
	const normalized = relPath.replace(/^\.\//, '');
	// Architecture checks stay closed until a Stop report names that path.
	if (archPath(normalized)) return namedPath(normalized, named);
	if (closed(normalized)) return false;
	if (CELLIX_CONTRACTS.includes(normalized)) return true;
	if (MAP_FILES.includes(normalized)) return true;
	if (named.some((entry) => (entry.endsWith('/') ? normalized.startsWith(entry) : normalized === entry))) return true;
	if (normalized.startsWith('packages/axc/') || normalized.startsWith('apps/')) return true;
	if (normalized.startsWith('packages/axc-verification/')) return true;
	return normalized.startsWith('task-set-') && normalized.endsWith('.md');
}

export function isOutputBranch(name) {
	return /-[ab]-out$/.test(name);
}

/** Harness edits run on any other branch. An unknown branch stays tight. */
export function harnessBranch(name) {
	return name !== '' && !isOutputBranch(name);
}

export function currentBranch(root) {
	if (process.env.AXC_GUARD_BRANCH) return process.env.AXC_GUARD_BRANCH;
	const git = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, encoding: 'utf8' });
	return git.status === 0 ? git.stdout.trim() : '';
}

function hasSeedArray(text) {
	return /\[[^[\]]*(?:\n[^[\]]*){15,}\]/.test(text);
}

function changedSource(root) {
	const git = spawnSync('git', ['status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' });
	if (git.status !== 0) return [];
	return git.stdout
		.split('\n')
		.map((line) => line.slice(3).split(' -> ').pop()?.trim().replaceAll('"', '') ?? '')
		.filter((file) => file.startsWith('packages/axc/') && file.endsWith('.ts') && !file.endsWith('.d.ts'));
}

/** Generic Cellix shape of the files this session changed. Empty when nothing under packages/axc changed, or the tree already matches. */
export function shapeGaps(root, changed = changedSource(root)) {
	if (!changed.length) return [];
	const gaps = [];
	const touched = new Set(changed.map((file) => file.slice('packages/axc/'.length).split('/')[0]));
	const missingLayers = LAYERS.filter((layer) => !touched.has(layer));
	if (missingLayers.length) gaps.push(`layers not touched: ${missingLayers.join(', ')}`);

	const domainOutside = changed.filter((file) => file.startsWith('packages/axc/domain/src/') && !file.startsWith('packages/axc/domain/src/domain/') && !file.endsWith('/index.ts') && !file.endsWith('.test.ts'));
	if (domainOutside.length) gaps.push(`domain implementation files must live under packages/axc/domain/src/domain/: ${domainOutside.join(', ')}`);

	const folders = new Map();
	for (const file of changed) {
		const match = /^packages\/axc\/domain\/src\/domain\/contexts\/([^/]+)\/([^/]+)\//.exec(file);
		if (!match) continue;
		const key = `${match[1]}/${match[2]}`;
		const names = folders.get(key) ?? new Set();
		names.add(path.basename(file));
		folders.set(key, names);
	}
	if (changed.some((file) => file.startsWith('packages/axc/domain/src/')) && folders.size === 0) {
		gaps.push('packages/axc/domain/src/domain/contexts/<context>/<entity>/<entity>.aggregate.ts');
	}
	for (const [key, names] of folders) {
		const entity = key.split('/')[1];
		const base = `packages/axc/domain/src/domain/contexts/${key}/`;
		for (const name of AGGREGATE_FILES(entity)) {
			if (names.has(name) || existsSync(path.join(root, base + name))) continue;
			gaps.push(
				name.endsWith('.aggregate.test.ts')
					? `${base}${name} — house shape requires this file beside the aggregate. Add the file. A package that already depends on vitest may add a test script. Do not add a vitest dependency or a vitest.config.ts.`
					: base + name,
			);
		}
	}

	const persistenceOutside = changed.filter((file) => file.startsWith('packages/axc/persistence/src/') && !file.includes('/datasources/') && !file.includes('/models/') && !file.endsWith('/index.ts') && !file.endsWith('.test.ts'));
	if (persistenceOutside.length) gaps.push(`persistence implementation files must live under src/datasources or src/models: ${persistenceOutside.join(', ')}`);

	const servicesOutside = changed.filter((file) => file.startsWith('packages/axc/application-services/src/') && !file.includes('/contexts/') && !file.endsWith('/index.ts') && !file.endsWith('.test.ts'));
	if (servicesOutside.length) gaps.push(`application-service implementations must live under src/contexts: ${servicesOutside.join(', ')}`);

	for (const file of changed.filter((item) => item.startsWith('packages/axc/application-services/src/') && !item.endsWith('.test.ts'))) {
		let text = '';
		try {
			text = readFileSync(path.join(root, file), 'utf8');
		} catch {
			continue;
		}
		if (hasSeedArray(text)) gaps.push(file);
	}
	return gaps;
}

/** A verify log whose only failure is a security gate, and the agent did not edit a package.json. */
export function securityEnd(log, packageJsonChanged, root = process.cwd()) {
	if (packageJsonChanged || !log || summarize(log, root).length) return null;
	if (!/vulnerable path|SNYK-|Tested \d+ projects|npm audit/i.test(log)) return null;
	return 'Stop allowed — pre-existing security finding. Do not edit .snyk, package manifests, or packages/cellix.';
}
