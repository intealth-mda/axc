export function stopFollowup({ status, loopCount = 0, verifyFlag, readyForVerify }) {
	if (status === 'aborted' || status === 'error') return null;
	if (verifyFlag === 'pass') return null;
	if (loopCount >= 1) return null;
	if (readyForVerify) return 'Run pnpm run agent-check -- pnpm run verify once.';
	return 'Run pnpm run agent-check -- pnpm run check.';
}
