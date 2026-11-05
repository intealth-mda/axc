// Token usage, estimated cost and elapsed time of a Codex session, read from its
// rollout log (~/.codex/sessions/**/rollout-*.jsonl). Ported from hac-oai-16.
//
//   node scripts/codex-session-usage.mjs --latest --line   one line for the agent's final summary
//   node scripts/codex-session-usage.mjs --latest          table for the evaluation run record
//   node scripts/codex-session-usage.mjs <rollout.jsonl>   a specific session
//
// --latest picks the newest session started in the current directory (or --cwd <path>),
// falling back to the newest session overall. The last token_count event carries the
// cumulative totals; input_tokens includes cached_input_tokens and output_tokens
// includes reasoning tokens.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// USD per 1M tokens at API list price: uncached input, cached input, output.
const LIST_PRICES = {
	'gpt-6.1-sol': { input: 2, cached: 0.1, output: 10 },
};

function listRollouts(directory, found = []) {
	let entries = [];
	try {
		entries = readdirSync(directory, { withFileTypes: true });
	} catch {
		return found;
	}
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			listRollouts(path, found);
		} else if (/^rollout-.*\.jsonl$/.test(entry.name)) {
			found.push(path);
		}
	}
	return found;
}

function latestRollout(cwd) {
	const candidates = listRollouts(join(homedir(), '.codex', 'sessions'))
		.map((path) => ({ path, mtime: statSync(path).mtimeMs }))
		.sort((a, b) => b.mtime - a.mtime);
	const fromCwd = candidates.find((candidate) =>
		readFileSync(candidate.path, 'utf8')
			.split('\n', 1)[0]
			.includes(`"cwd":${JSON.stringify(cwd)}`),
	);
	return (fromCwd ?? candidates[0])?.path;
}

function summarise(jsonl) {
	const summary = { sessionId: undefined, cwd: undefined, model: undefined, startedAt: undefined, endedAt: undefined, userMessages: 0, toolCalls: 0, approvalRequests: 0, totals: {} };
	for (const line of jsonl.split('\n')) {
		if (line.trim() === '') {
			continue;
		}
		let record;
		try {
			record = JSON.parse(line);
		} catch {
			continue;
		}
		const payload = record.payload ?? {};
		summary.startedAt ??= record.timestamp;
		summary.endedAt = record.timestamp ?? summary.endedAt;
		if (record.type === 'session_meta') {
			summary.sessionId = payload.id;
			summary.cwd = payload.cwd;
			summary.model ??= payload.model ?? payload.model_provider_id;
		}
		if (record.type === 'turn_context') {
			summary.model = payload.model ?? summary.model;
		}
		if (record.type === 'event_msg' && payload.type === 'token_count' && payload.info?.total_token_usage) {
			summary.totals = payload.info.total_token_usage;
		}
		if (record.type === 'response_item' && payload.type === 'message' && payload.role === 'user') {
			summary.userMessages += 1;
		}
		if (record.type === 'response_item' && /^(function_call|custom_tool_call)$/.test(payload.type ?? '')) {
			summary.toolCalls += 1;
		}
		if (record.type === 'event_msg' && /approval/.test(payload.type ?? '')) {
			summary.approvalRequests += 1;
		}
	}
	return summary;
}

function estimateCost(model, totals) {
	const price = LIST_PRICES[model];
	if (price === undefined || totals.input_tokens === undefined) {
		return undefined;
	}
	const cached = totals.cached_input_tokens ?? 0;
	const dollars = ((totals.input_tokens - cached) * price.input + cached * price.cached + (totals.output_tokens ?? 0) * price.output) / 1_000_000;
	return { dollars, note: `${model} list price: $${price.input} input / $${price.cached} cached / $${price.output} output per 1M` };
}

function formatElapsed(startedAt, endedAt) {
	if (startedAt === undefined || endedAt === undefined) {
		return 'unknown';
	}
	const seconds = Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000);
	return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

const count = (value) => (typeof value === 'number' ? value.toLocaleString('en-US') : 'n/a');

function main() {
	const args = process.argv.slice(2);
	const cwdIndex = args.indexOf('--cwd');
	const path = args.includes('--latest') ? latestRollout(cwdIndex === -1 ? process.cwd() : args[cwdIndex + 1]) : args.find((arg) => !arg.startsWith('--'));
	if (path === undefined) {
		console.error('usage: node scripts/codex-session-usage.mjs --latest [--line] [--cwd <path>] | <rollout.jsonl>');
		process.exit(2);
	}
	const summary = summarise(readFileSync(path, 'utf8'));
	const totals = summary.totals;
	const cost = estimateCost(summary.model, totals);
	const costText = cost === undefined ? `no list price for ${summary.model ?? 'unknown model'}` : `~$${cost.dollars.toFixed(2)} (${cost.note})`;
	if (args.includes('--line')) {
		console.log(
			`Codex usage so far (${summary.model ?? 'unknown model'}, session ${summary.sessionId ?? 'unknown'}): ${count(totals.input_tokens)} input tokens (${count(totals.cached_input_tokens)} cached), ${count(totals.output_tokens)} output tokens (${count(totals.reasoning_output_tokens)} reasoning); estimated cost ${costText}; elapsed ${formatElapsed(summary.startedAt, summary.endedAt)}.`,
		);
		return;
	}
	const rows = [
		['Rollout', path],
		['Session', summary.sessionId ?? 'unknown'],
		['Working directory', summary.cwd ?? 'unknown'],
		['Model', summary.model ?? 'unknown'],
		['Input Tokens', count(totals.input_tokens)],
		['Cached Tokens', count(totals.cached_input_tokens)],
		['Output Tokens', count(totals.output_tokens)],
		['Reasoning Output Tokens', count(totals.reasoning_output_tokens)],
		['Total Tokens', count(totals.total_tokens)],
		['Estimated Cost', costText],
		['Elapsed Time', formatElapsed(summary.startedAt, summary.endedAt)],
		['User messages (incl. harness-injected context)', summary.userMessages],
		['Tool calls', summary.toolCalls],
		['Approval events', summary.approvalRequests],
	];
	for (const [label, value] of rows) {
		console.log(`${label.padEnd(46)} ${value}`);
	}
}

main();
