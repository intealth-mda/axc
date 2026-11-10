// A package with src/archunit-tests keeps those files on `test:arch` only. Its `test` script and the
// vitest config `test` uses must not load archunit-tests (they need the arch config's globals). Dependency-free.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOTS = ['apps', 'packages', 'packages/axc', 'packages/axc-verification', 'packages/cellix'];
const DEFAULT_CONFIGS = ['vitest.config.ts', 'vitest.config.mts', 'vitest.config.js', 'vitest.config.mjs'];

/** Problems for one package. `read(rel)` returns a file's text or null. Pure. */
export function scopeProblems(name, scripts = {}, read = () => null) {
	const problems = [];
	const test = scripts.test;
	const arch = scripts['test:arch'];
	if (arch && !/archunit|vitest\.arch\.config/.test(arch)) problems.push(`${name}: test:arch must run the arch config (vitest.arch.config.ts)`);
	if (!test) return problems;
	if (/archunit|vitest\.arch\.config/.test(test)) {
		problems.push(`${name}: test must not name archunit-tests or vitest.arch.config; only test:arch runs them`);
		return problems;
	}
	if (!/\bvitest\b/.test(test)) return problems;
	const flag = /--config[= ]\s*(\S+)/.exec(test)?.[1];
	const configs = flag ? [flag] : DEFAULT_CONFIGS;
	const config = configs.map((file) => ({ file, text: read(file) })).find((entry) => entry.text !== null);
	if (!config) {
		problems.push(`${name}: test runs vitest with no vitest.config.ts, so vitest's default include loads src/archunit-tests`);
		return problems;
	}
	const text = config.text;
	const excludes = /\bnodeConfig\b/.test(text) || /exclude[\s\S]*src\/archunit-tests/.test(text);
	if (/\barchConfig\b/.test(text) || !excludes) problems.push(`${name}: ${config.file} must exclude src/archunit-tests (merge nodeConfig from @cellix/config-vitest)`);
	return problems;
}

/** Workspace package dirs (relative) that have src/archunit-tests. */
export function archPackages(root) {
	const out = [];
	for (const base of ROOTS) {
		const dir = path.join(root, base);
		if (!existsSync(dir)) continue;
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const rel = `${base}/${entry.name}`;
			if (entry.isDirectory() && existsSync(path.join(root, rel, 'package.json')) && existsSync(path.join(root, rel, 'src/archunit-tests'))) out.push(rel);
		}
	}
	return out;
}

export function checkTestScope(root) {
	const problems = [];
	for (const rel of archPackages(root)) {
		const pkg = JSON.parse(readFileSync(path.join(root, rel, 'package.json'), 'utf8'));
		const read = (file) => {
			try {
				return readFileSync(path.join(root, rel, file), 'utf8');
			} catch {
				return null;
			}
		};
		problems.push(...scopeProblems(pkg.name ?? rel, pkg.scripts ?? {}, read));
	}
	return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	const root = path.resolve(import.meta.dirname, '..');
	const problems = checkTestScope(root);
	if (problems.length) {
		console.error(`test scope check failed:\n${problems.join('\n')}`);
		process.exit(1);
	}
	console.log(`test scope: ${archPackages(root).length} packages keep src/archunit-tests on test:arch only`);
}
