// Cellix-shape Stop check (blocking, narrowly scoped). Archunit already gates placement (domain code under
// src/domain/**); this adds the per-aggregate shape it cannot see, and only for domain modules ADDED in this change:
//   - a new runtime module in domain/src/domain/contexts/<ctx>/<agg>/ needs a colocated <stem>.test.ts
//   - that aggregate folder needs an index.ts (its public surface)
// A change that adds no domain module (a REST route, a query over existing code, docs, edits) is never blocked.
// Exempt: index.ts, *.d.ts, tests/specs, features/, *.repository.ts / *.uow.ts (interfaces), *.visa.ts / *.passport.ts /
// *.domain-permissions.ts (context policy files), and modules with no runtime code (types and interfaces only).
import path from 'node:path';

const AGG = /(^|\/)domain\/src\/domain\/contexts\/[^/]+\/[^/]+\/(.+\/)?[^/]+\.ts$/;
const EXEMPT = /(^|\/)(index|.+\.(d|test|spec|repository|uow|visa|passport|domain-permissions))\.ts$|(^|\/)features\//;
const RUNTIME = /^[ \t]*(?:export[ \t]+)?(?:default[ \t]+)?(?:declare[ \t]+)?(?:abstract[ \t]+)?(?:async[ \t]+)?(?:function|class|const|let|var|enum)\b/m;

/** True when the source declares runtime code (not just types/interfaces). Comments are ignored. Pure. */
export function hasRuntimeCode(src) {
	return RUNTIME.test(String(src).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''));
}

/** `added` = repo-relative paths added in this change; `exists(f)` / `read(f)` see the working tree. → problems. */
export function shapeProblems(added, { exists, read }) {
	const has = (f) => added.includes(f) || exists(f);
	const problems = [];
	const folders = new Set();
	for (const f of added) {
		if (!AGG.test(f) || EXEMPT.test(f) || !hasRuntimeCode(read(f) ?? '')) continue;
		const test = f.replace(/\.ts$/, '.test.ts');
		if (!has(test)) problems.push(`cellix  ${f} — add its colocated unit test ${test}`);
		folders.add(path.posix.dirname(f));
	}
	for (const dir of folders) if (!has(`${dir}/index.ts`)) problems.push(`cellix  ${dir}/ — add ${dir}/index.ts exporting the aggregate's public surface`);
	return problems;
}
