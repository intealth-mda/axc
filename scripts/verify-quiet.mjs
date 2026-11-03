import { spawn } from 'node:child_process';
import { closeSync, mkdirSync, mkdtempSync, openSync } from 'node:fs';
import { constants } from 'node:os';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL('../.agents-work/verification/', import.meta.url);
mkdirSync(directory, { recursive: true });
const run = mkdtempSync(fileURLToPath(directory) + 'run-');
const log = `${run}/verify.log`;
const fd = openSync(log, 'wx', 0o600);
console.log(`Running pnpm run verify; full log: ${log}`);
const child = spawn('pnpm', ['run', 'verify'], {
	cwd,
	stdio: ['inherit', fd, fd],
	detached: process.platform !== 'win32',
});
closeSync(fd);

// Forward interrupts to the whole gate pipeline, including Turbo/test children.
const handlers = new Map();
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
	const handler = () => {
		if (!child.pid) return;
		try {
			if (process.platform === 'win32') child.kill(signal);
			else process.kill(-child.pid, signal);
		} catch (error) {
			if (error.code !== 'ESRCH') throw error;
		}
	};
	handlers.set(signal, handler);
	process.on(signal, handler);
}

let failedToStart = false;
child.on('error', (error) => {
	failedToStart = true;
	console.error(`verify could not start: ${error.message}; full log: ${log}`);
	process.exitCode = 1;
});

child.on('close', (code, signal) => {
	if (failedToStart) code = 1;
	for (const [name, handler] of handlers) process.off(name, handler);
	console.log(`verify exit=${code ?? 'none'} signal=${signal ?? 'none'}; full log: ${log}`);
	console.log('Inspect the log for stage results; stages after a failure did not execute.');
	if (signal) {
		process.exitCode = 128 + (constants.signals[signal] ?? 1);
		process.kill(process.pid, signal);
	} else {
		process.exitCode = code ?? 1;
	}
});
