import { appendFileSync } from 'node:fs';

export function decisionLine(entry) {
	return `${JSON.stringify({
		at: entry.at ?? new Date().toISOString(),
		tool: entry.tool,
		path: entry.path ?? null,
		command: entry.command ?? null,
		permission: entry.permission,
		ruleId: entry.ruleId ?? null,
	})}\n`;
}

export function appendDecision(file, entry) {
	appendFileSync(file, decisionLine(entry), 'utf8');
}
