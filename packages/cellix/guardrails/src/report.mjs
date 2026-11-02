// The next turn sees the first failure: the file, the rule, and the lines that say what to change.

const NOISE = /\[ELIFECYCLE\]|node_modules|^(?:Found \d+ errors?\.?|Checked \d+ files.*)$/;
const ANCHOR = /Expected:|^Found:|^Rule:|error TS\d+|AssertionError|Formatter would have printed|lint\/|\bformat ━|packages\/\S+\.(?:ts|tsx|mjs|js|json)|\(\d+,\d+\)|:\d+:\d+/;
const PATH = /packages\/\S+\.(?:ts|tsx|mjs|js|json)/;

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
