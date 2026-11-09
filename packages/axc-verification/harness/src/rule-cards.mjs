import cards from './rule-cards.json' with { type: 'json' };

const aliases = [
	['optional-spread', /optional|spread/i],
	['insert-many', /insertMany|seed/i],
	['get-new-item', /getNewItem|addItem/i],
	['status-409', /\b409\b/],
	['status-400', /\b400\b/],
	['status-404', /\b404\b/],
	['vo-string', /VOString|minLength|maxLength/],
	['mongo-filter', /Record<string, unknown>|bracket/i],
	['empty-function', /\bfunction\b/],
	['read-repo', /read repository|EntityReference/i],
	['session-deny', /denied|agentAccess|session/i],
];

export function cardForRule(ruleId) {
	return cards[ruleId] ?? null;
}

export function cardForCheckOutput(text) {
	for (const [ruleId, pattern] of aliases) {
		if (pattern.test(text)) {
			return { ruleId, card: cards[ruleId] };
		}
	}
	return null;
}

export function cardForDeny(ruleId) {
	const fromCommand = {
		explore: 'session-deny',
		install: 'session-deny',
		redirect: 'session-deny',
		agentId: 'session-deny',
		verifyFile: 'session-deny',
	}[ruleId];
	const id = cards[ruleId] ? ruleId : fromCommand;
	if (!id) return null;
	return { ruleId: id, card: cards[id] };
}
