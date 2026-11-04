import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERIFY_LIMIT = 'One wrapped pnpm run verify already ran. Repeat it only after that verify fails, and only once.';
const ACCEPTANCE_LIMIT = 'Acceptance runs inside the one wrapped pnpm run verify. Run acceptance by itself only after that verify fails.';
const TERMINAL_STOP_LIMIT = 'Wrapped verify already ended on a terminal dependency advisory failure. Stop further agent-check commands; report findings and stop.';
const VALIDATION_DONE_LIMIT = 'Validation budget finished after wrapped verify. Stop further agent-check commands; report findings and stop.';
const POST_VERIFY_LIMIT = 'After the first wrapped verify, only narrow failing tests or one verify rerun are allowed. Do not run knip, audit, or other full-repo checks outside verify.';
const BUDGET_TAMPER_LIMIT = 'Do not read, modify, or delete .axc-check-budget.json during a run.';

export function commandText(command, args = []) {
	return [command, ...args].join(' ');
}

export function isWrapped(text) {
	return text.includes('scripts/agent-check.mjs');
}

export function isVerify(text) {
	return /(?:^|\s)pnpm(?:\s+run)?\s+verify(?:\s|$)/.test(text);
}

export function isAcceptance(text) {
	return /\btest:acceptance\b/.test(text) && !isVerify(text);
}

export function isNarrowTest(text) {
	const value = String(text ?? '');
	if (isVerify(value) || isAcceptance(value)) {
		return false;
	}
	if (/\bknip\b|\baudit\b|\bsnyk\b|\be18e\b|\btest:arch\b/i.test(value)) {
		return false;
	}
	return /\bvitest\b|\bturbo run test\b|\brun test\b/i.test(value);
}

export function readBudget(cwd = process.cwd()) {
	try {
		const budget = JSON.parse(readFileSync(budgetPath(cwd), 'utf8'));
		return {
			verifies: Number(budget.verifies) || 0,
			lastVerifyStatus: budget.lastVerifyStatus ?? null,
			terminal: Boolean(budget.terminal),
		};
	} catch {
		return { verifies: 0, lastVerifyStatus: null, terminal: false };
	}
}

export function recordVerify(status, options = {}, cwd = process.cwd()) {
	const terminal = Boolean(options.terminal);
	const budget = readBudget(cwd);
	budget.verifies += 1;
	budget.lastVerifyStatus = status ?? 1;
	if (terminal) {
		budget.terminal = true;
	}
	writeFileSync(budgetPath(cwd), `${JSON.stringify(budget)}\n`);
}

export function isCompileOrTypecheckFailure(log) {
	const text = String(log ?? '');
	if (/\berror TS\d+:/i.test(text)) {
		return true;
	}
	if (/\bType error:/i.test(text)) {
		return true;
	}
	if (/\bERROR\s+.*#(?:typecheck|build)\b/i.test(text)) {
		return true;
	}
	if (/\[ELIFECYCLE\].*(?:typecheck|build)\b/i.test(text) && /\berror TS\d+/i.test(text)) {
		return true;
	}
	return false;
}

export function isTerminalAdvisoryFailure(log) {
	const text = String(log ?? '');
	// Never treat a compile/typecheck failure as advisory-terminal "done".
	if (isCompileOrTypecheckFailure(text)) {
		return false;
	}
	// Require a real audit/snyk step header from verify's && chain — not harness
	// source text (e.g. Biome printing check-budget.mjs regexes).
	const auditFailed = /(?:^|\n)\s*(?:\$ )?pnpm run audit\b/m.test(text) && /\d+\s+vulnerabilities?\s+found\b/i.test(text);
	const snykFailed = /(?:^|\n)\s*(?:\$ )?pnpm run snyk\b/m.test(text) && /(?:\[ELIFECYCLE\].*snyk|Command failed.*snyk|snyk.*(?:failed|error))/i.test(text);
	return auditFailed || snykFailed;
}

export function budgetTamperReason(text) {
	if (/\.axc-check-budget\.json\b/.test(String(text ?? ''))) {
		return BUDGET_TAMPER_LIMIT;
	}
	return undefined;
}

export function rejectionReason(text, budget = readBudget()) {
	// Once advisory-terminal, block every further agent-check command (not only verify).
	if (budget.terminal) {
		return TERMINAL_STOP_LIMIT;
	}
	// After a passing verify, or after the allowed failed+retry pair, stop all agent-check.
	if (budget.verifies >= 2 || (budget.verifies >= 1 && budget.lastVerifyStatus === 0)) {
		return VALIDATION_DONE_LIMIT;
	}
	if (isAcceptance(text)) {
		return budget.verifies > 0 && budget.lastVerifyStatus !== 0 ? undefined : ACCEPTANCE_LIMIT;
	}
	if (isVerify(text)) {
		if (budget.verifies >= 2 || budget.lastVerifyStatus === 0) {
			return VERIFY_LIMIT;
		}
		return undefined;
	}
	// After first failed verify: only narrow tests (then the one verify rerun above).
	if (budget.verifies >= 1) {
		return isNarrowTest(text) ? undefined : POST_VERIFY_LIMIT;
	}
	return undefined;
}

export function rawBroadCommandReason(text) {
	const tamper = budgetTamperReason(text);
	if (tamper !== undefined) {
		return tamper;
	}
	if (isWrapped(text) || (!isVerify(text) && !isAcceptance(text))) {
		return undefined;
	}
	return 'Run pnpm run verify through node scripts/agent-check.mjs. Acceptance runs inside that one verify.';
}

function budgetPath(cwd) {
	return resolve(cwd, process.env.AXC_CHECK_BUDGET ?? '.axc-check-budget.json');
}
