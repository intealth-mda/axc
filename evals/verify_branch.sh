#!/usr/bin/env bash
# Verify one output branch honestly.
#
# Turbo replays a cached `test:arch` result, and a cached green from an
# earlier tree state hides a real failure: baseline Task B passed husky's
# pre-commit verify and then failed the same chain on a cold cache, because
# the architecture test had been replayed. Always cold, always after a
# frozen-lockfile install, never while another run is in flight.
#
# usage: verify_branch.sh <repo> <branch> [--no-snyk]
set -uo pipefail
REPO="${1:?usage: verify_branch.sh <repo> <branch> [--no-snyk]}"
BRANCH="${2:?branch}"
cd "$REPO" || exit 1

if [ "${3:-}" = "--no-snyk" ]; then
  SHIM=/tmp/_axc_no_snyk; mkdir -p "$SHIM"
  printf '#!/bin/sh\nexit 1\n' > "$SHIM/snyk"; chmod +x "$SHIM/snyk"
  export PATH="$SHIM:$PATH"
fi

if pgrep -f 'claude -p' >/dev/null 2>&1; then
  echo "  REFUSING: an evaluation run is in flight. The acceptance suite starts"
  echo "  a real Functions host and two at once collide on the port, which"
  echo "  reports a failure the agent did not cause."
  exit 2
fi

git checkout -q "$BRANCH" || exit 1
rm -rf .turbo
corepack pnpm install --frozen-lockfile >/dev/null 2>&1
OUT="/tmp/verify-${BRANCH}.txt"
corepack pnpm run verify > "$OUT" 2>&1
rc=$?
echo "  $BRANCH: VERIFY_EXIT=$rc"
grep -q 'Snyk: SKIPPED' "$OUT" && echo "  snyk: SKIPPED (not a pass)"
[ $rc -ne 0 ] && grep -E '^\s*Failed:|AssertionError|error TS' "$OUT" | head -5 | sed 's/^/  /'
echo "  full log: $OUT"
exit $rc
