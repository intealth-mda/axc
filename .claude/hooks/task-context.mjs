// UserPromptSubmit hook: when a prompt names a task set ("Task Set A", "task-set-b"), injects that set's
// requirement files (task-set-<x>-*.md in the repo root or .agents-work/) into the context once per session.
// The agent starts with the acceptance criteria instead of searching for them. Later prompts in the same session
// that name the same set add nothing, because the files are already in context.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 40_000;

try {
	const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
	const match = /task[\s_-]*set[\s_-]*([ab])\b/i.exec(input.prompt ?? '');
	if (!match) process.exit(0);
	const set = match[1].toLowerCase();

	const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
	const stateDir = join(root, '.agents-work', 'session');
	mkdirSync(stateDir, { recursive: true });
	const stateFile = join(stateDir, `${input.session_id ?? 'unknown'}-task-context.json`);
	const injected = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : [];
	if (injected.includes(set)) process.exit(0);

	const pattern = new RegExp(`^task-set-${set}-.*\\.md$`, 'i');
	const files = [root, join(root, '.agents-work')]
		.filter((dir) => existsSync(dir))
		.flatMap((dir) =>
			readdirSync(dir)
				.filter((name) => pattern.test(name))
				.map((name) => join(dir, name)),
		);
	if (files.length === 0) process.exit(0);

	let output = `Task Set ${set.toUpperCase()} files, injected by the task-context hook. Do not read them again.\n`;
	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		if (output.length + text.length > MAX_BYTES) {
			output += `\n--- ${file.slice(root.length + 1)} (too large to inject; read it directly) ---\n`;
			continue;
		}
		output += `\n--- ${file.slice(root.length + 1)} ---\n${text}\n`;
	}
	// Written in biome's layout (`["a", "b"]`), so `biome check .` in verify and pre-commit accepts the file.
	writeFileSync(stateFile, `[${[...injected, set].map((name) => JSON.stringify(name)).join(', ')}]\n`);
	process.stdout.write(output);
} catch {
	// Never block a prompt.
}
process.exit(0);
