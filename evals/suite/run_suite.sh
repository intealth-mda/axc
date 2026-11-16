#!/usr/bin/env bash
# Run every suite task (or the ones named) once against a harness branch, then summarize.
# usage: run_suite.sh <harness-branch> <rep> [task ...]     log: axc-harness/evidence/suite/<harness>-suite-rep<rep>.log
set -u
H=${1:?harness branch}; REP=${2:?rep}; shift 2
SUITE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EV=${SUITE_EVIDENCE:-$SUITE/../../axc-harness/evidence/suite}; mkdir -p "$EV"
TASKS=${*:-$(ls "$SUITE/tasks")}
LOG="$EV/$H-suite-rep$REP.log"
{
  echo "=== SUITE $H rep $REP: $(echo $TASKS) ($(date +%F)) ==="
  for T in $TASKS; do bash "$SUITE/run_task.sh" "$H" "$T" "$REP"; done
  echo "=== SUMMARY ==="
  python3 "$SUITE/summary.py" "$LOG"
} 2>&1 | tee "$LOG"
