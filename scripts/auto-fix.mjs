// Stop-hook auto-fix (stop-gate runs it before the commit's verify). Only the agent's changed files inside the write
// dirs; never write-boundary path_deny files. Test/spec/step files get only fixer 1, never one that edits assertions.
//   1. useAwait: drop `async` where biome reports no `await`. A signature that names `Promise<` keeps `async`
//      unless every return is already a Promise (`Promise.resolve` / `Promise.reject`). In test files a body with
//      `throw` keeps `async` (a rejection a test may assert would become a synchronous throw).
//   1b. noUselessConstructor: biome's unsafe fix (remove a constructor that only calls `super` with the same
//      arguments), this rule only, non-test files. Cellix seedwork base constructors are public, so removal keeps
//      `new X(...)`; typecheck in verify still runs after it.
//   2. parameter properties become fields and constructor assignments (`erasableSyntaxOnly`).
//   3. TS4111 dot access becomes brackets, and a `useLiteralKeys` line gets a biome-ignore. The bracket form is what
//      `noPropertyAccessFromIndexSignature` requires; biome's own fix would turn it back into a dot.
//   4. knip --fix (exports + types; repeated --fix-type: knip 5.88 ignores the comma form): drop unused `export`s;
//      any other file knip touches is restored. knip errors (e.g. an unbuilt worktree: vitest configs import workspace
//      `dist/`) → `pnpm run build` once (turbo-cached; verify's build then hits the cache) and retry.
//      First, the folder-named factory in an application-services entity index (the export
//      application-services-conventions requires) gets a `/** @public */` tag, so knip keeps that one export.
//   5. biome check --write: safe fixes + format only (no --unsafe; 1b is the one unsafe fix, for one rule).
// Dependency-free; every fixer is optional (missing node_modules/.bin → skipped) and fails open. Returns log lines.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Repo-locating vars (set inside git hooks) would point these git calls at another repo: always use `root`.
const gitEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_(DIR|WORK_TREE|INDEX_FILE|COMMON_DIR|OBJECT_DIRECTORY|PREFIX)$/.test(k)));
const TEST = /(^|\/)(step-definitions|__tests__|features)\/|\.(test|spec)\.[cm]?[jt]sx?$|\.steps\.[cm]?[jt]sx?$|\.feature$/;
const CODE = /\.[cm]?[jt]sx?$/;
const BIOME = /\.([cm]?[jt]sx?|jsonc?|css)$/;

/** Changed paths (tracked edits + untracked files, existing only) from `git status --porcelain -z -uall`. */
export function changedFiles(root) {
	const r = spawnSync('git', ['status', '--porcelain', '-z', '-uall'], { cwd: root, env: gitEnv(), encoding: 'utf8', maxBuffer: 64 << 20 });
	if (r.status !== 0) return [];
	const parts = r.stdout.split('\0');
	const files = [];
	for (let i = 0; i < parts.length; i++) {
		const e = parts[i];
		if (!e) continue;
		if (e[0] === 'R' || e[0] === 'C') i++; // next entry is the rename source
		const f = e.slice(3);
		if (existsSync(path.join(root, f))) files.push(f);
	}
	return files;
}

/** Which changed files each fixer may touch. Pure. */
export function fixTargets(files, { dirs = [], deny = [] } = {}) {
	const inside = files.filter((f) => (!dirs.length || dirs.some((d) => f.startsWith(`${d}/`))) && !deny.some((re) => re.test(f)));
	const ok = inside.filter((f) => !TEST.test(f));
	return { biome: ok.filter((f) => BIOME.test(f)), code: ok.filter((f) => CODE.test(f)), tests: inside.filter((f) => TEST.test(f) && CODE.test(f)) };
}

/** True when `expr` is already a Promise, so dropping `async` keeps a declared `Promise<…>` return. */
function promiseExpr(expr) {
	let s = expr.trim();
	while (s.startsWith('(') && s.endsWith(')')) {
		const inner = s.slice(1, -1).trim();
		if (!inner) break;
		s = inner;
	}
	return /^(?:Promise\s*\.\s*(?:resolve|reject|all|allSettled|race|any|try|withResolvers)\s*\(|new\s+Promise\s*[<(])/.test(s);
}

/** Return expressions in the function body. `open` is the `{` or the start of an arrow expression, within `src`. */
function returnsArePromises(src, open, kind) {
	if (kind === 'expr') {
		const expr = src.slice(open).split(/[;\n]/, 1)[0] ?? '';
		return expr.trim().length > 0 && promiseExpr(expr);
	}
	let depth = 0;
	let stmt = '';
	const exprs = [];
	for (let i = open; i < src.length; i++) {
		const c = src[i];
		if (c === '{') {
			depth++;
			stmt = '';
			continue;
		}
		if (c === '}') {
			if (depth === 1 && /^\s*return\b/.test(stmt)) exprs.push(stmt.replace(/^\s*return\b/, '').trim());
			depth--;
			stmt = '';
			if (depth === 0) break;
			continue;
		}
		if (depth !== 1) continue;
		if (c === ';') {
			if (/^\s*return\b/.test(stmt)) exprs.push(stmt.replace(/^\s*return\b/, '').trim());
			stmt = '';
			continue;
		}
		stmt += c;
	}
	return exprs.length > 0 && exprs.every(promiseExpr);
}

/** `{` of a block body, or the expression after `=>`. Offsets are within `rest`, which starts at `async`. */
function bodyAt(rest) {
	let paren = 0;
	let angle = 0;
	for (let i = 0; i < rest.length; i++) {
		const c = rest[i];
		if (c === '(') paren++;
		else if (c === ')') paren--;
		else if (c === '<' && paren === 0) angle++;
		else if (c === '>' && angle > 0) angle--;
		else if (paren === 0 && angle === 0 && rest.startsWith('=>', i)) {
			let k = i + 2;
			while (rest[k] === ' ' || rest[k] === '\t' || rest[k] === '\n' || rest[k] === '\r') k++;
			if (rest[k] === '{') return { kind: 'block', at: k, sigEnd: i };
			return { kind: 'expr', at: k, sigEnd: i };
		} else if (paren === 0 && angle === 0 && c === '{') return { kind: 'block', at: i, sigEnd: i };
	}
	return null;
}

/** Body text from `at`: a balanced `{…}` block, or an arrow expression up to its line end. */
function bodyText(rest, body) {
	if (body.kind === 'expr') return rest.slice(body.at).split('\n', 1)[0] ?? '';
	let depth = 0;
	for (let i = body.at; i < rest.length; i++) {
		if (rest[i] === '{') depth++;
		else if (rest[i] === '}' && --depth === 0) return rest.slice(body.at, i + 1);
	}
	return rest.slice(body.at);
}

/** Drop `async` at 1-based {line, col} spots (biome useAwait starts). Skips generators and a `Promise<` signature
 * whose returns are not already Promises (dropping `async` there would return the bare value). `keepThrow` also
 * skips a body that contains `throw` (used for test files). Pure. */
export function dropAsync(src, spots, { keepThrow = false } = {}) {
	const starts = [0];
	for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
	const offsets = spots.map(({ line, col }) => (starts[line - 1] ?? Number.NaN) + col - 1).filter((o) => Number.isInteger(o) && o >= 0);
	let n = 0;
	for (const o of [...new Set(offsets)].sort((a, b) => b - a)) {
		const rest = src.slice(o);
		const m = /^async\s+/.exec(rest);
		if (!m || /^async\s*(function\s*)?\*/.test(rest)) continue;
		const body = bodyAt(rest);
		if (!body) continue;
		if (/\bPromise\s*</.test(rest.slice(0, body.sigEnd)) && !returnsArePromises(rest, body.at, body.kind)) continue;
		if (keepThrow && /\bthrow\b/.test(bodyText(rest, body))) continue;
		src = src.slice(0, o) + rest.slice(m[0].length);
		n++;
	}
	return { src, n };
}

function matchParen(src, open) {
	let depth = 0;
	for (let i = open; i < src.length; i++) {
		if (src[i] === '(') depth++;
		else if (src[i] === ')') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

function splitParams(paramSrc) {
	const parts = [];
	let depth = 0;
	let cur = '';
	for (const c of paramSrc) {
		if ('<({['.includes(c)) depth++;
		else if ('>)}]'.includes(c)) depth--;
		if (c === ',' && depth === 0) {
			parts.push(cur.trim());
			cur = '';
		} else cur += c;
	}
	if (cur.trim()) parts.push(cur.trim());
	return parts;
}

function defaultAt(rest) {
	let depth = 0;
	for (let i = 0; i < rest.length; i++) {
		if ('<({['.includes(rest[i])) depth++;
		else if ('>)}]'.includes(rest[i])) depth--;
		else if (rest[i] === '=' && depth === 0) return i;
	}
	return -1;
}

/** `constructor(private x: T)` → a field plus `this.x = x` (`erasableSyntaxOnly` rejects the parameter property). Pure. */
export function expandParameterProperties(src) {
	let n = 0;
	let out = '';
	let i = 0;
	while (i < src.length) {
		const found = /\bconstructor\s*\(/.exec(src.slice(i));
		if (!found) {
			out += src.slice(i);
			break;
		}
		const start = i + found.index;
		const paren = start + found[0].length - 1;
		const end = matchParen(src, paren);
		if (end < 0) {
			out += src.slice(i);
			break;
		}
		let brace = end + 1;
		while (src[brace] === ' ' || src[brace] === '\t' || src[brace] === '\n' || src[brace] === '\r') brace++;
		if (src[brace] !== '{') {
			out += src.slice(i, brace);
			i = brace;
			continue;
		}
		const fields = [];
		const plain = [];
		const assigns = [];
		for (const raw of splitParams(src.slice(paren + 1, end))) {
			const prop = /^((?:(?:public|private|protected|readonly|override|declare|accessor)\s+)+)(\.\.\.)?([A-Za-z_$][\w$]*)([\s\S]*)$/.exec(raw);
			if (!prop || prop[2]) {
				plain.push(raw);
				continue;
			}
			const mods = prop[1].replace(/\s+/g, ' ').trim();
			const name = prop[3];
			const rest = prop[4].trim();
			const eq = defaultAt(rest);
			const typed = (eq < 0 ? rest : rest.slice(0, eq).trimEnd()).trim();
			const fieldType = typed.startsWith(':') || typed.startsWith('?') || typed === '' ? typed : ` ${typed}`;
			fields.push(`${mods} ${name}${fieldType};`);
			plain.push(rest === '' ? name : `${name}${typed.startsWith(':') || typed.startsWith('?') ? '' : ' '}${rest}`);
			assigns.push(`this.${name} = ${name};`);
		}
		if (!fields.length) {
			out += src.slice(i, brace + 1);
			i = brace + 1;
			continue;
		}
		const lineStart = src.lastIndexOf('\n', start) + 1;
		const indent = /^\s*/.exec(src.slice(lineStart, start))?.[0] ?? '';
		const lead = src.slice(lineStart + indent.length, start);
		const inner = `${indent}\t`;
		out += src.slice(i, lineStart);
		out += fields.map((field) => `${indent}${field}`).join('\n');
		out += `\n${indent}${lead}constructor(${plain.join(', ')}) {\n`;
		out += assigns.map((line) => `${inner}${line}`).join('\n');
		out += '\n';
		i = brace + 1;
		n += fields.length;
	}
	return { src: out, n };
}

/** `obj.q` → `obj['q']` at 1-based spots whose `col` is the property name. Skips a spot that is not a dot access. Pure. */
export function bracketIndexAccess(src, spots) {
	const starts = [0];
	for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
	let n = 0;
	const ordered = [...spots].sort((a, b) => b.line - a.line || b.col - a.col);
	for (const spot of ordered) {
		const at = (starts[spot.line - 1] ?? Number.NaN) + spot.col - 1;
		if (!Number.isInteger(at) || src.slice(at, at + spot.prop.length) !== spot.prop) continue;
		if (src[at - 1] !== '.') continue;
		src = `${src.slice(0, at - 1)}['${spot.prop}']${src.slice(at + spot.prop.length)}`;
		n++;
	}
	return { src, n };
}

const LITERAL_KEY_IGNORE = '// biome-ignore lint/complexity/useLiteralKeys: index signature';

/** Insert the house ignore above 1-based lines. A line that already carries the comment is left alone. Pure. */
export function ignoreLiteralKeys(src, lines) {
	const rows = src.split('\n');
	let n = 0;
	for (const line of [...new Set(lines)].sort((a, b) => b - a)) {
		const idx = line - 1;
		if (idx < 0 || idx >= rows.length) continue;
		const prev = rows[idx - 1] ?? '';
		if (prev.includes('lint/complexity/useLiteralKeys') || prev.includes('lint:useLiteralKeys')) continue;
		const indent = /^\s*/.exec(rows[idx])?.[0] ?? '';
		rows.splice(idx, 0, `${indent}${LITERAL_KEY_IGNORE}`);
		n++;
	}
	return { src: rows.join('\n'), n };
}

/** Entity indexes the application-services factory-export convention checks: src/contexts/<context>/<entity>/index.ts. */
export const CONVENTION_INDEX = /^packages\/axc\/application-services\/src\/contexts\/[^/]+\/[^/]+\/index\.ts$/;
const PUBLIC_TAG = '/** @public Folder-named factory required by application-services-conventions. */';

/** Tag the one convention factory (`export const <E> = (` beside `export interface <E>ApplicationService`) `@public`,
 * so knip treats it as a public export. Other exports in the file stay reportable. Pure. */
export function tagConventionFactory(src, file) {
	if (!CONVENTION_INDEX.test(file)) return { src, n: 0 };
	const name = /export\s+interface\s+(\w+)ApplicationService\b/.exec(src)?.[1];
	if (!name) return { src, n: 0 };
	const decl = new RegExp(`^([ \\t]*)export\\s+const\\s+${name}\\s*=\\s*\\(`, 'm').exec(src);
	if (!decl) return { src, n: 0 };
	const before = src.slice(0, decl.index).trimEnd();
	const doc = before.endsWith('*/') ? before.slice(before.lastIndexOf('/**')) : '';
	if (/@public\b/.test(doc)) return { src, n: 0 };
	return { src: `${src.slice(0, decl.index)}${decl[1]}${PUBLIC_TAG}\n${src.slice(decl.index)}`, n: 1 };
}

const hasBuild = (root) => {
	try {
		return Boolean(JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).scripts?.build);
	} catch {
		return false;
	}
};

/** Run the fixers. `prefix` is a shell snippet run first (e.g. `nvm use`). Returns log lines, e.g. `knip: a.ts`. */
export function autoFix(root, targets, { prefix = '', env = process.env } = {}) {
	const bin = (n) => path.join(root, 'node_modules/.bin', n);
	const sh = (cmd, args, cwd = root) => spawnSync('sh', ['-c', `${prefix}"$0" "$@"`, cmd, ...args], { cwd, env, encoding: 'utf8', maxBuffer: 64 << 20 });
	const read = (f) => {
		try {
			return readFileSync(path.join(root, f));
		} catch {
			return null;
		}
	};
	const digest = (f) => {
		const b = read(f);
		return b ? createHash('sha1').update(b).digest('hex') : '';
	};
	const touched = (files, fn) => {
		const before = files.map(digest);
		fn();
		return files.filter((f, i) => digest(f) !== before[i]);
	};
	const log = [];
	try {
		const tests = targets.tests ?? [];
		const awaitFiles = [...targets.code, ...tests];
		if (awaitFiles.length && existsSync(bin('biome'))) {
			const r = sh(bin('biome'), ['lint', '--only=suspicious/useAwait', '--reporter=github', '--no-errors-on-unmatched', ...awaitFiles]);
			const byFile = new Map();
			for (const m of `${r.stdout}`.matchAll(/^::\w+ title=lint\/suspicious\/useAwait,file=([^,]+),line=(\d+),(?:[^:]*?,)?col=(\d+)/gm)) {
				const f = path.relative(root, path.resolve(root, m[1]));
				if (awaitFiles.includes(f)) byFile.set(f, [...(byFile.get(f) ?? []), { line: Number(m[2]), col: Number(m[3]) }]);
			}
			const fixed = [];
			for (const [f, spots] of byFile) {
				const { src, n } = dropAsync(read(f).toString('utf8'), spots, { keepThrow: tests.includes(f) });
				if (n) {
					writeFileSync(path.join(root, f), src);
					fixed.push(f);
				}
			}
			if (fixed.length) log.push(`useAwait (drop async): ${fixed.join(', ')}`);
		}
		if (targets.code.length && existsSync(bin('biome'))) {
			const t = touched(targets.code, () => sh(bin('biome'), ['lint', '--only=complexity/noUselessConstructor', '--write', '--unsafe', '--no-errors-on-unmatched', ...targets.code]));
			if (t.length) log.push(`noUselessConstructor (remove): ${t.join(', ')}`);
		}
		if (targets.code.length) {
			const fixed = [];
			for (const f of targets.code) {
				const buf = read(f);
				if (!buf) continue;
				const { src, n } = expandParameterProperties(buf.toString('utf8'));
				if (n) {
					writeFileSync(path.join(root, f), src);
					fixed.push(f);
				}
			}
			if (fixed.length) log.push(`parameter properties: ${fixed.join(', ')}`);
		}
		if (targets.code.length && existsSync(bin('tsgo'))) {
			const byDir = new Map();
			for (const f of targets.code) {
				const dir = /^(?:packages\/[^/]+\/[^/]+|apps\/[^/]+)\//.exec(f)?.[0].replace(/\/$/, '') ?? '';
				byDir.set(dir, [...(byDir.get(dir) ?? []), f]);
			}
			const spots = new Map();
			for (const [dir, files] of byDir) {
				const r = sh(bin('tsgo'), ['--noEmit', '--pretty', 'false'], path.join(root, dir));
				for (const m of `${r.stdout}\n${r.stderr}`.matchAll(/^(.+)\((\d+),(\d+)\): error TS4111: Property '([^']+)'/gm)) {
					const file = path.relative(root, path.resolve(root, dir, m[1]));
					if (!files.includes(file)) continue;
					spots.set(file, [...(spots.get(file) ?? []), { line: Number(m[2]), col: Number(m[3]), prop: m[4] }]);
				}
			}
			const fixed = [];
			for (const [f, list] of spots) {
				const buf = read(f);
				if (!buf) continue;
				const bracketed = bracketIndexAccess(buf.toString('utf8'), list);
				const ignored = ignoreLiteralKeys(
					bracketed.src,
					list.map((spot) => spot.line),
				);
				if (bracketed.n || ignored.n) {
					writeFileSync(path.join(root, f), ignored.src);
					fixed.push(f);
				}
			}
			if (fixed.length) log.push(`index signature brackets: ${fixed.join(', ')}`);
		}
		if (targets.code.length && existsSync(bin('biome'))) {
			const r = sh(bin('biome'), ['lint', '--only=complexity/useLiteralKeys', '--reporter=github', '--no-errors-on-unmatched', ...targets.code]);
			const byFile = new Map();
			for (const m of `${r.stdout}`.matchAll(/^::\w+ title=lint\/complexity\/useLiteralKeys,file=([^,]+),line=(\d+),/gm)) {
				const f = path.relative(root, path.resolve(root, m[1]));
				if (targets.code.includes(f)) byFile.set(f, [...(byFile.get(f) ?? []), Number(m[2])]);
			}
			const fixed = [];
			for (const [f, lines] of byFile) {
				const buf = read(f);
				if (!buf) continue;
				const { src, n } = ignoreLiteralKeys(buf.toString('utf8'), lines);
				if (n) {
					writeFileSync(path.join(root, f), src);
					fixed.push(f);
				}
			}
			if (fixed.length) log.push(`useLiteralKeys ignore: ${fixed.join(', ')}`);
		}
		if (targets.code.length) {
			const fixed = [];
			for (const f of targets.code) {
				const buf = read(f);
				if (!buf) continue;
				const { src, n } = tagConventionFactory(buf.toString('utf8'), f);
				if (n) {
					writeFileSync(path.join(root, f), src);
					fixed.push(f);
				}
			}
			if (fixed.length) log.push(`convention factory @public: ${fixed.join(', ')}`);
		}
		if (targets.code.length && existsSync(bin('knip'))) {
			const saved = new Map(
				changedFiles(root)
					.filter((f) => !targets.code.includes(f))
					.map((f) => [f, read(f)]),
			);
			const knip = () => sh(bin('knip'), ['--fix', '--fix-type', 'exports', '--fix-type', 'types', '--no-exit-code', '--no-progress', '--no-config-hints']);
			let built = false;
			const t = touched(targets.code, () => {
				if (knip().status === 0 || !hasBuild(root)) return;
				built = sh('pnpm', ['run', 'build']).status === 0;
				if (built) knip();
			});
			if (built) log.push('build (knip could not load its config before it)');
			for (const f of changedFiles(root)) {
				if (targets.code.includes(f)) continue;
				if (!saved.has(f)) spawnSync('git', ['checkout', '-q', '--', f], { cwd: root, env: gitEnv() });
				else if (saved.get(f) && !saved.get(f).equals(read(f) ?? Buffer.alloc(0))) writeFileSync(path.join(root, f), saved.get(f));
			}
			if (t.length) log.push(`knip --fix exports,types: ${t.join(', ')}`);
		}
		if (targets.biome.length && existsSync(bin('biome'))) {
			const t = touched(targets.biome, () => sh(bin('biome'), ['check', '--write', '--no-errors-on-unmatched', ...targets.biome]));
			if (t.length) log.push(`biome check --write: ${t.join(', ')}`);
		}
	} catch {
		// fail open: verify reports whatever is left
	}
	return log;
}
