#!/usr/bin/env bash
# Run one suite task against one harness branch, then grade it.
#
# usage: run_task.sh <harness-branch> <task-id> <rep>     e.g. run_task.sh esb-ant-15 C v1
# env:   AXC_REPO (axc clone, default ~/claude-agent-optimization/axc), SUITE_EVIDENCE (log dir),
#        REST_BRANCH (branch checked out after grading, default esb-ant-9).
#        Run from a copy of evals/ outside AXC_REPO: this script checks out other branches there.
#
# Setup commit on a fresh output branch <harness>-suite-<task>-rep<rep>:
#   fresh  tasks start from the harness branch as is (empty app, like Task A/B);
#   seeded tasks overlay the app from meta.json "seed" (a measured Task B output: courses
#          + enrollment requests) and apply meta.json "patch" if any (a planted bug).
#   The task's requirements file is copied to the repo root as task-set-<id>-requirements.md.
# Then the agent runs headless on the task's prompt (same flags as run_iteration.sh), its work
# is committed, and graded: cold verify, the task's HTTP probe, the review-notes check, and the
# Cellix shape check when meta.json "shape" is true (feature tasks; a bug fix or docs task
# does not touch every layer).
set -uo pipefail
H=${1:?harness branch}; T=${2:?task id}; REP=${3:?rep}
REPO=${AXC_REPO:-$HOME/claude-agent-optimization/axc}
SUITE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; E="$(dirname "$SUITE")"
TD="$SUITE/tasks/$T"; [ -d "$TD" ] || { echo "no task $T"; exit 1; }
EV=${SUITE_EVIDENCE:-$E/../axc-harness/evidence/suite}; mkdir -p "$EV"
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
MODEL=${MODEL:-claude-opus-5-5}
meta() { python3 -c "import json,sys;print(json.load(open('$TD/meta.json')).get('$1',''))"; }
BASE=$(meta base); SEED=$(meta seed); PATCH=$(meta patch); SHAPE=$(meta shape)
OUT="$H-suite-$T-rep$REP"; LT=$(echo "$T" | tr 'A-Z' 'a-z')

cd "$REPO" || exit 1
if pgrep -f '^[^ ]*claude [-]p' >/dev/null; then echo "REFUSING: another run in flight"; exit 2; fi
[ -z "$(git status --porcelain)" ] || { echo "REFUSING: working tree not clean"; exit 2; }
git checkout -q "$H" || exit 1
bash "$E/reset_build_outputs.sh" . >/dev/null || exit 1
git checkout -q -b "$OUT" || exit 1
if [ "$BASE" = seeded ]; then
  git checkout -q "$SEED" -- apps packages || exit 1
  [ -n "$PATCH" ] && { git apply "$TD/$PATCH" || { echo "patch failed"; exit 1; }; }
fi
cp "$TD/requirements.md" "task-set-$LT-requirements.md"
git add -A && git commit -q --no-verify -m "suite setup: task $T ($BASE)" || exit 1
SETUP=$(git rev-parse HEAD)
corepack pnpm install --frozen-lockfile >/dev/null 2>&1; rm -rf .turbo
for pid in $(lsof -ti tcp:7071 2>/dev/null); do kill "$pid" 2>/dev/null; done

echo "=== $(date +%H:%M:%S) $OUT ($BASE) ==="
LOG="$EV/$OUT.json"
caffeinate -i claude -p "$(cat "$TD/prompt.md")" --model "$MODEL" --setting-sources project \
  --permission-mode bypassPermissions --max-budget-usd 25 --output-format json > "$LOG" 2>"/tmp/$OUT.err"
python3 -c "
import json;d=json.load(open('$LOG'))
print(f\"  run: \${d.get('total_cost_usd',0):.2f} | {d.get('duration_ms',0)/60000:.1f} min | turns {d.get('num_turns')} | error={d.get('is_error')}\")"
git add -A; git diff --cached --quiet || git commit -q --no-verify -m "agent output: $H suite task $T rep $REP ($MODEL)"

bash "$E/verify_branch.sh" . "$OUT" 2>&1 | grep -E 'VERIFY_EXIT'
python3 "$SUITE/probe.py" --repo . --task "$T" --out "$EV/$OUT.probe.json" | tail -1
python3 "$E/review_notes_check.py" . "$SETUP" "$OUT" | tail -1
[ "$SHAPE" = True ] && python3 "$E/cellix_shape.py" . "$SETUP" "$OUT" 2>&1 | tail -1
git checkout -q "${REST_BRANCH:-esb-ant-9}"; rm -rf .turbo
echo "=== $(date +%H:%M:%S) $OUT DONE ==="
