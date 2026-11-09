const repairs = {
	explore: 'Do not list the tree. Edit the file the check names.',
	install: 'Do not run pnpm install. Run pnpm run agent-check -- pnpm run check.',
	redirect: 'Do not pipe or redirect agent-check. Run pnpm run agent-check -- pnpm run check.',
	agentId: 'Do not assign CELLIX_AGENT_ID. The session file already holds the id.',
	verifyFile: 'Do not write .cellix/verify.json. Run pnpm run agent-check -- pnpm run verify.',
};

function decision(ruleId) {
	return {
		permission: 'deny',
		ruleId,
		agent_message: repairs[ruleId],
		user_message: repairs[ruleId],
	};
}

export function decideCommand(command) {
	const text = command ?? '';
	if (/CELLIX_AGENT_ID\s*=/.test(text)) return decision('agentId');
	if (/\.cellix\/verify\.json/.test(text)) return decision('verifyFile');
	if (/\bpnpm\s+(install|add|remove|link)\b/.test(text)) return decision('install');
	if (/agent-check\b/.test(text) && /(\||>)/.test(text)) return decision('redirect');
	if (/(^|[;&|]\s*)(ls|rg|grep|find|glob)\b/.test(text)) return decision('explore');
	return { permission: 'allow', ruleId: null, agent_message: '', user_message: '' };
}

export function decideWrite(path) {
	if (path === '.cellix/verify.json' || path.endsWith('/.cellix/verify.json')) {
		return decision('verifyFile');
	}
	return { permission: 'allow', ruleId: null, agent_message: '', user_message: '' };
}

export function hookResponse(input) {
	const command = input?.command ?? input?.tool_input?.command ?? '';
	const path = input?.path ?? input?.file_path ?? input?.tool_input?.path ?? '';
	const decided = command ? decideCommand(command) : decideWrite(path);
	return {
		permission: decided.permission,
		agent_message: decided.agent_message,
		user_message: decided.user_message,
		ruleId: decided.ruleId,
	};
}
