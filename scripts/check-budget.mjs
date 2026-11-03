import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERIFY_LIMIT = 'One wrapped pnpm run verify already ran. Repeat it only after that verify fails, and only once.';
const ACCEPTANCE_LIMIT = 'Acceptance runs inside the one wrapped pnpm run verify. Run acceptance by itself only after that verify fails.';
const TERMINAL_VERIFY_LIMIT =
	'Wrapped verify already ended on a terminal dependency advisory failure. Report the findings and stop; do not rerun verify.';
const TERMINAL_ACCEPTANCE_LIMIT =
	'Wrapped verify already ended on a terminal dependency advisory failure. Do not rerun acceptance; report findings and stop.';
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

export function isTerminalAdvisoryFailure(log) {
	const text = String(log ?? '');
	// verify is &&-chained; reaching audit/snyk means earlier stages passed.
	const auditFailed =
		/\bvulnerabilities found\b/i.test(text) && /(?:pnpm\s+(?:run\s+)?audit|--audit-level)/i.test(text);
	const snykFailed =
		/(?:pnpm\s+(?:run\s+)?snyk|snyk-verify)/i.test(text) &&
		/(?:\[ELIFECYCLE\].*snyk|Command failed.*snyk|snyk.*(?:failed|error))/i.test(text);
	return auditFailed || snykFailed;
}

export function budgetTamperReason(text) {
	if (/\.axc-check-budget\.json\b/.test(String(text ?? ''))) {
		return BUDGET_TAMPER_LIMIT;
	}
	return undefined;
}

export function rejectionReason(text, budget = readBudget()) {
	if (isAcceptance(text)) {
		if (budget.terminal) {
			return TERMINAL_ACCEPTANCE_LIMIT;
		}
		return budget.verifies > 0 && budget.lastVerifyStatus !== 0 ? undefined : ACCEPTANCE_LIMIT;
	}
	if (!isVerify(text)) {
		return undefined;
	}
	if (budget.terminal) {
		return TERMINAL_VERIFY_LIMIT;
	}
	if (budget.verifies >= 2 || budget.lastVerifyStatus === 0) {
		return VERIFY_LIMIT;
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
