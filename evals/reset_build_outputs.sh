#!/usr/bin/env bash
# Give every arm the same build state: delete gitignored build outputs, rebuild
# from the checked-out config branch, then drop turbo caches (preflight wants
# them cold).
#
# Build outputs are gitignored, so they survive `git checkout` between arms.
# Iteration 9's pilot found an arm's acceptance suite serving the previous
# arm's apps/api/deploy bundle; packages/*/dist carried the previous arm's
# compiled code too. One Task B run lost ~8 turns debugging it.
#
# usage: reset_build_outputs.sh <repo>
set -uo pipefail
cd "${1:?usage: reset_build_outputs.sh <repo>}" || exit 1
n=0
while IFS= read -r p; do
  git check-ignore -q "$p" || continue   # never touch a tracked or unignored path
  rm -rf "$p" && n=$((n + 1))
done < <(find apps packages -name node_modules -prune -o \
  \( -type d \( -name dist -o -name deploy -o -name target -o -name reports -o -name coverage \
     -o -name .turbo -o -name .docusaurus -o -name build \) -o -name '*.tsbuildinfo' -o -name '*.zip' \) \
  -print -prune)
echo "  reset: removed $n ignored build outputs"
corepack pnpm run build >/tmp/reset-build.log 2>&1 || { echo "  reset: BUILD FAILED (see /tmp/reset-build.log)"; exit 1; }
rm -rf .turbo; find apps packages -name node_modules -prune -o -type d -name .turbo -print -prune | xargs rm -rf
echo "  reset: rebuilt from $(git rev-parse --abbrev-ref HEAD), turbo caches cleared"
