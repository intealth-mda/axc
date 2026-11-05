import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commandText, isCompileOrTypecheckFailure, isTerminalAdvisoryFailure, isVerify, readBudget, recordVerify, rejectionReason } from './check-budget.mjs';

// Tighter FAIL dump than prior 40 lines / 4KB — keep actionable, cut cache.
const MAX_ERROR_LINES = 20;
const MAX_ERROR_CHARS = 2048;

const args = process.argv.slice(2);
if (args[0] === '--') {
	args.shift();
}

if (args.length === 0) {
	console.error('Usage: node scripts/agent-check.mjs -- <command> [args...]');
	process.exit(2);
}

const [command, ...commandArgs] = args;
const displayCommand = [command, ...commandArgs].map(formatArgument).join(' ');
const requestedText = commandText(command, commandArgs);
const blocked = rejectionReason(requestedText, readBudget());
if (blocked !== undefined) {
	console.error(`FAIL: ${displayCommand}`);
	console.error(blocked);
	process.exit(1);
}

const directory = mkdtempSync(join(tmpdir(), 'axc-agent-check-'));
const logPath = join(directory, 'command.log');
const logFile = openSync(logPath, 'w');
const result = spawnSync(command, commandArgs, {
	cwd: process.cwd(),
	env: process.env,
	stdio: ['ignore', logFile, logFile],
});
closeSync(logFile);

const exitCode = result.status ?? 1;
const log = result.status === 0 ? '' : stripAnsi(readFileSync(logPath, 'utf8'));
const terminal = isVerify(requestedText) && exitCode !== 0 && isTerminalAdvisoryFailure(log);

if (isVerify(requestedText)) {
	recordVerify(exitCode, { terminal });
}

if (result.status === 0) {
	// PASS stays one line; full log stays on disk only (never printed).
	console.log(`PASS: ${displayCommand}`);
	process.exit(0);
}

const lines = log.split(/\r?\n/);
const failedCheck = findFailedCheck(lines);
const errorBlock = boundErrorBlock(findErrorBlock(lines));

console.error(`FAIL: ${displayCommand}`);
console.error(`Exit code: ${exitCode}`);
if (failedCheck !== undefined) {
	console.error(`Failed check: ${failedCheck}`);
}
if (terminal) {
	console.error('Terminal: dependency advisory failure. Do not rerun verify or acceptance; report findings and stop.');
} else if (isVerify(requestedText) && isCompileOrTypecheckFailure(log)) {
	console.error('Non-terminal: typecheck or build failure. Fix the diagnostics, then rerun one wrapped verify.');
}
if (result.error !== undefined) {
	console.error(`Cause: ${result.error.message}`);
}
console.error(`Log: ${logPath}`);
if (errorBlock.length > 0) {
	console.error('Error:');
	console.error(errorBlock.join('\n'));
}

process.exit(exitCode);

function formatArgument(value) {
	return /^[A-Za-z0-9_./:@=-]+$/.test(value) ? value : JSON.stringify(value);
}

function stripAnsi(value) {
	return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
}

function findFailedCheck(lines) {
	for (const line of lines) {
		const failed = line.match(/^\s*Failed:\s*(.+)\s*$/);
		if (failed !== null) {
			return failed[1];
		}
		const turbo = line.match(/\bERROR\s+(@?\S+#\S+):/);
		if (turbo !== null) {
			return turbo[1];
		}
	}
	return undefined;
}

function findErrorBlock(lines) {
	const specificPatterns = [
		/^\s*[×✗]\s*/,
		/\bfunction timed out\b/i,
		/\bExecution failed\b/i,
		/\bFound \d+ errors?\b/i,
		/\bUnused exports?(?:ed)?\b/i,
		/\bUndefined(?: step|\. Implement with)\b/,
		/\bis not a function\b/,
		/\d+ failing\b/i,
		/\bscenarios?.*\bfailed\b/i,
		/\bFAIL\b/,
		/AssertionError:/,
		/\berror TS\d+:/i,
		/\bFailed Tests\b/i,
	];
	const specificIndexes = specificPatterns.map((pattern) => lines.findIndex((line) => pattern.test(line))).filter((candidate) => candidate !== -1);
	const index = specificIndexes.length > 0 ? Math.min(...specificIndexes) : lines.findIndex((line) => /\[ELIFECYCLE\]|\bERROR\b/.test(line));

	if (index === -1) {
		return lines.filter((line) => line.trim() !== '').slice(-8);
	}

	return lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 10));
}

function boundErrorBlock(block) {
	const truncated = [];
	let chars = 0;
	for (const line of block) {
		if (truncated.length >= MAX_ERROR_LINES || chars >= MAX_ERROR_CHARS) {
			truncated.push('… (truncated; use Log path with rg/tail only)');
			break;
		}
		const room = MAX_ERROR_CHARS - chars;
		if (line.length > room) {
			truncated.push(`${line.slice(0, Math.max(0, room))}… (truncated; use Log path with rg/tail only)`);
			break;
		}
		truncated.push(line);
		chars += line.length + 1;
	}
	return truncated;
}
