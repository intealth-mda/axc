import { readFileSync } from 'node:fs';
import { stopFollowup } from './stop-followup.mjs';

const chunks = [];
for await (const chunk of process.stdin) {
	chunks.push(chunk);
}

const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
let verifyFlag = input.verifyFlag;
if (!verifyFlag) {
	try {
		const stamp = JSON.parse(readFileSync('.cellix/verify.json', 'utf8'));
		verifyFlag = stamp.flag;
	} catch {
		verifyFlag = null;
	}
}

const message = stopFollowup({
	status: input.status,
	loopCount: input.loop_count ?? 0,
	verifyFlag,
	readyForVerify: process.env.CELLIX_READY_FOR_VERIFY === '1',
});

process.stdout.write(`${JSON.stringify(message ? { followup_message: message } : {})}\n`);
