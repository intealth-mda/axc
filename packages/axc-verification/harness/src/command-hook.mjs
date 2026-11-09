import { hookResponse } from './decide-command.mjs';
import { appendDecision } from './decision-log.mjs';

const chunks = [];
for await (const chunk of process.stdin) {
	chunks.push(chunk);
}

const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
const response = hookResponse(input);
const logFile = process.env.CELLIX_HARNESS_LOG;
if (logFile) {
	appendDecision(logFile, {
		tool: input.tool_name ?? 'shell',
		command: input.command ?? input.tool_input?.command ?? null,
		path: input.path ?? input.file_path ?? input.tool_input?.path ?? null,
		permission: response.permission,
		ruleId: response.ruleId,
	});
}
process.stdout.write(
	`${JSON.stringify({
		permission: response.permission,
		agent_message: response.agent_message,
		user_message: response.user_message,
	})}\n`,
);
