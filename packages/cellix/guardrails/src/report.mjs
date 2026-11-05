// The next turn sees the first failure: the file, the rule, and the lines that say what to change.

const NOISE = /\[ELIFECYCLE\]|node_modules|^(?:Found \d+ errors?\.?|Checked \d+ files.*)$/;
const ANCHOR = /Expected:|^Found:|^Rule:|error TS\d+|AssertionError|Formatter would have printed|lint\/|\bformat ━|packages\/\S+\.(?:ts|tsx|mjs|js|json)|\(\d+,\d+\)|:\d+:\d+/;
const PATH = /packages\/\S+\.(?:ts|tsx|mjs|js|json)/;
const RECEIVED = /^Received (?:number|string|boolean|object):\s*(.*)$/;
const EXPECTED_VALUE = /^Expected (?:number|string|boolean|object):\s*(.*)$/;
const REPLICA_SET = /replica set member or mongos/;

/** The first failure, capped. A second file starts the next check. */
export function errorBlock(lines) {
	const trimmed = lines.map((line) => line.trim()).filter((line) => line.length > 0 && !NOISE.test(line));
	const start = trimmed.findIndex((line) => ANCHOR.test(line));
	if (start < 0) return trimmed.slice(-4);
	const block = [];
	for (const line of trimmed.slice(start)) {
		if (block.length >= 8) break;
		if (block.length > 0 && laterFile(line, block[0])) break;
		block.push(line);
	}
	const lead = block.filter((line) => line.includes('Expected:') || line.includes('AssertionError') || line.includes('.feature:'));
	const rest = block.filter((line) => !lead.includes(line));
	return [...lead, ...rest];
}

function laterFile(line, first) {
	const next = line.match(PATH);
	const opened = first.match(PATH);
	if (next === null || opened === null) return false;
	if (line.startsWith('Rule:') || line.startsWith('Found:') || line.startsWith('Expected:')) return false;
	return next[0] !== opened[0];
}

const BODY_LINE = /Acceptance failure body: status=\S+ body=(.*)$/;
const STEP_FILE = /(packages\/\S+?\.steps\.ts:\d+:\d+)/;

/**
 * The first acceptance assertion. The last line repeats the scenario, Expected, Received, body, and step file.
 * A standalone memory server cannot commit withScopedTransaction.
 */
export function acceptanceReport(lines) {
	const cleaned = [];
	let stepFile = '';
	for (const line of lines) {
		const marker = ':test:acceptance:';
		const at = line.indexOf(marker);
		const text = (at >= 0 ? line.slice(at + marker.length) : line).trim();
		if (text.length === 0 || text.includes('node_modules')) continue;
		const file = text.match(STEP_FILE);
		if (file !== null) stepFile = file[1];
		if (text.startsWith('at ')) continue;
		cleaned.push(text);
	}
	const findings = [];
	let failures = 0;
	for (let index = 0; index < cleaned.length; index++) {
		const received = cleaned[index].match(RECEIVED);
		if (received === null) continue;
		failures += 1;
		if (findings.length > 0) continue;
		let expected = '';
		let scenario = '';
		let step = '';
		for (let back = index - 1; back >= 0 && index - back < 40; back--) {
			const prior = cleaned[back];
			if (expected.length === 0 && EXPECTED_VALUE.test(prior)) {
				const match = prior.match(EXPECTED_VALUE);
				expected = match === null ? '' : match[1];
			}
			if (step.length === 0 && /^(?:When|Then|Given|And)\b/.test(prior)) step = prior;
			if (scenario.length === 0 && /^[A-Za-z].+: .+/.test(prior) && !/^(?:Expected|Received|Assertion|Expectation|When|Then|Given|And|Before|After)/.test(prior)) scenario = prior;
		}
		const value = received[1];
		const body = failureBody(cleaned, index, value);
		if (REPLICA_SET.test(value) || REPLICA_SET.test(body)) {
			findings.push('Expected: createMemoryMongoServer() returns a one-node replica set. A standalone memory server cannot run withScopedTransaction.');
		} else {
			findings.push(`Scenario: ${scenario}`);
			if (step.length > 0) findings.push(`Step: ${step}`);
			findings.push(`Expected: ${expected}`);
		}
		findings.push(`Received: ${value}`);
		if (body.length > 0) findings.push(`Body: ${body}`);
		if (stepFile.length > 0) findings.push(`File: ${stepFile}`);
		findings.push(`Acceptance: ${scenario}. Expected: ${expected}. Received: ${value}.${body.length > 0 ? ` Body: ${body}.` : ''}${stepFile.length > 0 ? ` File: ${stepFile}.` : ''}`);
	}
	if (failures > 1) findings.unshift(`${failures - 1} later acceptance assertions also failed. Fix the first Acceptance line.`);
	return findings;
}

function failureBody(lines, index, received) {
	if (received.startsWith('{') || received.startsWith('[')) return clip(received);
	for (let forward = index; forward < Math.min(lines.length, index + 25); forward++) {
		const match = lines[forward].match(BODY_LINE);
		if (match !== null) return clip(match[1]);
	}
	return '';
}

function clip(value) {
	return value.length > 500 ? `${value.slice(0, 500)}…` : value;
}
