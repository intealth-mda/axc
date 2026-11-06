#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createInterface } from 'node:readline';

const path = process.argv[2];
if (!path || process.argv.length !== 3) {
	console.error('Usage: node scripts/session-usage.mjs <session.jsonl[.zst]>');
	process.exitCode = 2;
} else {
	try {
		await access(path);
		const compressed = path.endsWith('.zst');
		const decoder = compressed ? spawn('zstd', ['-dc', path], { stdio: ['ignore', 'pipe', 'pipe'] }) : undefined;
		const decoderExit = decoder
			? new Promise((resolve, reject) => {
					decoder.once('error', reject);
					decoder.once('close', resolve);
				})
			: undefined;
		const stream = decoder?.stdout ?? createReadStream(path);
		const fields = ['input_tokens', 'cached_input_tokens', 'cache_write_input_tokens', 'output_tokens', 'reasoning_output_tokens', 'total_tokens'];
		const sums = Object.fromEntries(fields.map((field) => [field, 0]));
		let calls = 0;
		let last;
		let firstInput;
		let lastInput;
		for await (const line of createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY })) {
			if (!line.trim()) continue;
			const entry = JSON.parse(line);
			if (entry.type !== 'token_usage_record') continue;
			const { usage, thread_token_usage: cumulative } = entry.payload ?? {};
			if (!usage || !cumulative) throw new Error('Token usage record lacks per-call or cumulative counters.');
			for (const field of fields) {
				if (!Number.isSafeInteger(usage[field]) || usage[field] < 0 || !Number.isSafeInteger(cumulative[field]) || cumulative[field] < 0) throw new Error(`Invalid ${field} at usage record ${calls + 1}.`);
				sums[field] += usage[field];
			}
			if (usage.input_tokens + usage.output_tokens !== usage.total_tokens) throw new Error(`Invalid total at usage record ${calls + 1}.`);
			firstInput ??= usage.input_tokens;
			lastInput = usage.input_tokens;
			last = cumulative;
			calls++;
		}
		if (decoderExit) {
			const code = await decoderExit;
			if (code !== 0) throw new Error(`zstd exited with status ${code}.`);
		}
		if (!calls) throw new Error('No token usage records found.');
		for (const field of fields) if (sums[field] !== last[field]) throw new Error(`Cumulative ${field} differs from per-call sum: ${last[field]} versus ${sums[field]}.`);
		if (last.cached_input_tokens + last.cache_write_input_tokens > last.input_tokens || last.reasoning_output_tokens > last.output_tokens) throw new Error('Token category inclusion is inconsistent.');
		console.log(JSON.stringify({ source: path, calls, usage: last, first_call_input_tokens: firstInput, last_call_input_tokens: lastInput, average_call_input_tokens: Math.round(last.input_tokens / calls) }, null, 2));
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
