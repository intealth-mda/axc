import { spawnSync } from 'node:child_process';

function run(args) {
	return spawnSync('snyk', args, { encoding: 'utf8' });
}

const version = run(['--version']);
if (version.status !== 0) {
	console.log('Snyk: UNAVAILABLE');
	console.log('Reason: the snyk CLI is not available on PATH.');
	console.log('Install the Snyk CLI and authenticate; an unavailable scan is not a pass.');
	process.exit(1);
}

console.log('Snyk: running snyk test --all-projects --policy-path=.snyk (local CLI, no monitor, no --remote-repo-url)');
const test = spawnSync('snyk', ['test', '--all-projects', '--policy-path=.snyk'], { stdio: 'inherit' });
process.exit(test.status ?? 1);
