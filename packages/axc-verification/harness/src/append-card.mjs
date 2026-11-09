import { cardLine } from './rule-cards.mjs';

const chunks = [];
for await (const chunk of process.stdin) {
	chunks.push(chunk);
}

const line = cardLine(Buffer.concat(chunks).toString('utf8'));
if (line) process.stdout.write(`${line}\n`);
