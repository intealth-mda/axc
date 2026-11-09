// Node major guard. `.nvmrc` pins the Node that verify, husky and the Stop hook assume; another major (e.g. macOS nvm
// leaving an older default first on PATH) otherwise surfaces as a cryptic pnpm or tool crash. Dependency-free.
// Usage: node scripts/node-guard.mjs [version] → exit 1 with the fix when the major differs (default: this node).
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Major pinned by `<root>/.nvmrc` (`24`, `v24.21.0`, `24.21`), or null when there is no usable pin. */
export function requiredMajor(root = path.join(import.meta.dirname, '..')) {
	try {
		const m = /^v?(\d+)\b/.exec(readFileSync(path.join(root, '.nvmrc'), 'utf8').trim());
		return m ? Number(m[1]) : null;
	} catch {
		return null;
	}
}

/** null when `version` (`v24.21.0`) has the required major (or nothing is pinned); else the error with its fix. Pure. */
export function nodeProblem(version, required) {
	if (!required) return null;
	const major = /^v?(\d+)\./.exec(String(version).trim())?.[1];
	if (Number(major) === required) return null;
	return [
		`Node ${String(version).trim() || '(not found)'} is active; this repo needs Node ${required} (.nvmrc).`,
		`Fix: \`nvm install ${required} && nvm use ${required}\` (and \`nvm alias default ${required}\` so new shells and hooks get it), or put a Node ${required} bin first on PATH. Then retry.`,
	].join(' ');
}

// realpath + file URL: a symlinked or space-containing path must still run main, not no-op.
const isMain = () => Boolean(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (isMain()) {
	const problem = nodeProblem(process.argv[2] ?? process.version, requiredMajor(process.cwd()) ?? requiredMajor());
	if (problem) {
		console.error(problem);
		process.exit(1);
	}
}
