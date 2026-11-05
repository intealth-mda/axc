// SessionStart hook: records the commit the session started from, so the Stop gate and `gate.mjs` can check
// exactly what this session changed. Prints nothing, so it adds no tokens to the context.
// A resumed or compacted session keeps its original base.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

try {
	const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
	const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
	const dir = join(root, '.agents-work', 'session');
	mkdirSync(dir, { recursive: true });
	const sessionFile = join(dir, `${input.session_id ?? 'unknown'}.json`);
	let record;
	if (existsSync(sessionFile)) {
		record = JSON.parse(readFileSync(sessionFile, 'utf8'));
	} else {
		const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
		record = { sessionId: input.session_id, base: head, startedAt: new Date().toISOString() };
		writeFileSync(sessionFile, `${JSON.stringify(record, null, '\t')}\n`);
	}
	// Tab indentation matches biome.json, so `biome check .` in verify and pre-commit accepts these files.
	writeFileSync(join(dir, 'latest.json'), `${JSON.stringify(record, null, '\t')}\n`);
} catch {
	// Never block a session from starting.
}
process.exit(0);
