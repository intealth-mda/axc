// node --test scripts/log-cap.test.mjs — the hard cap on failure text shown to the agent.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capLog, LOG_CAP } from './log-cap.mjs';

const many = Array.from({ length: 500 }, (_, i) => `line ${i}`).join('\n');

test('text within the cap is returned unchanged', () => {
	assert.equal(capLog('check FAILED: 1 problem\nts a.ts TS2305'), 'check FAILED: 1 problem\nts a.ts TS2305');
	assert.equal(capLog(''), '');
});
test('too many lines → head + one marker + tail, within the line cap', () => {
	const out = capLog(many, { log: '/tmp/v.log' }).split('\n');
	assert.equal(out.length, LOG_CAP.lines);
	assert.equal(out[0], 'line 0');
	assert.equal(out.at(-1), 'line 499');
	assert.equal(out.filter((l) => l.startsWith('… [log cap: ')).length, 1);
	assert.match(out.join('\n'), /… \[log cap: 421 line\(s\) cut; full log: \/tmp\/v\.log\] …/);
});
test('too many characters → within the char cap, head and tail kept; long lines clipped with a count', () => {
	const wide = Array.from({ length: 40 }, (_, i) => `${i} ${'x'.repeat(5000)}`).join('\n');
	const out = capLog(wide);
	assert.ok(out.length <= LOG_CAP.chars, `${out.length}`);
	assert.match(out, /^0 x+… \[\+4002 chars\]/);
	assert.match(out, /\n39 x+… \[\+4003 chars\]$/);
	assert.match(out, /… \[log cap: \d+ line\(s\) cut\] …/);
	assert.ok(capLog('y'.repeat(50000), { chars: 300 }).length <= 300);
});
