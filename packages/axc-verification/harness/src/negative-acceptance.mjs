function scenario(name, when, then) {
	return [`  Scenario: ${name}`, `    When ${when}`, `    Then ${then}`].join('\n');
}

export function negativeAcceptanceFeature({ name, route }) {
	const path = `/api/${route}`;
	const lines = [
		`Feature: ${name}`,
		'',
		scenario(`${name} succeeds`, `the client calls GET ${path}`, 'the response status is 200'),
		'',
		scenario(`${name} rejects a bad value`, `the client calls GET ${path} with a bad value`, 'the response status is 400'),
		'',
		scenario(`${name} rejects a missing id`, `the client calls GET ${path} with a missing id`, 'the response status is 404'),
		'',
		scenario(`${name} rejects a duplicate`, `the client calls GET ${path} with a duplicate`, 'the response status is 409'),
		'',
	];
	return lines.join('\n');
}

export function thenPhrases(feature) {
	return [...feature.matchAll(/^\s*Then (.+)$/gm)].map((match) => match[1]);
}
