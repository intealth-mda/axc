import { spawnSync } from 'node:child_process';

function run(args) {
	return spawnSync('snyk', args, { encoding: 'utf8' });
}

const version = run(['--version']);
if (version.status !== 0) {
	console.error('Snyk: UNAVAILABLE');
	console.error('Reason: the snyk CLI is not available on PATH.');
	console.error('Install and authenticate the Snyk CLI; an unavailable scan is not a pass.');
	process.exit(1);
}

console.log('Snyk: running snyk test --all-projects --policy-path=.snyk (local CLI, no monitor, no --remote-repo-url)');
const test = spawnSync('snyk', ['test', '--all-projects', '--policy-path=.snyk'], { stdio: 'inherit' });
process.exit(test.status ?? 1);
