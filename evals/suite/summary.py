#!/usr/bin/env python3
"""One row per task from a run_suite.sh log: cost, turns, verify, acceptance, review notes,
Cellix shape; then totals. A task passes when verify exits 0, every probed criterion passes,
review notes pass and (feature tasks) the Cellix shape passes.
usage: summary.py <suite log>"""
import re, sys

rows, cur = [], None
for line in open(sys.argv[1], errors="replace"):
    if m := re.match(r"=== \S+ (\S+-suite-(\w+)-rep\S+) \((\w+)\) ===", line):
        cur = {"task": m[2], "base": m[3], "cost": None, "turns": None, "verify": None,
               "probe": None, "notes": None, "shape": None}
        rows.append(cur)
    elif cur is None:
        continue
    elif m := re.search(r"run: \$([\d.]+) \| ([\d.]+) min \| turns (\d+)", line):
        cur.update(cost=float(m[1]), mins=float(m[2]), turns=int(m[3]))
    elif m := re.search(r"VERIFY_EXIT=(\d+)", line):
        cur["verify"] = int(m[1])
    elif m := re.search(r"acceptance: (\d+)/(\d+)", line):
        cur["probe"] = (int(m[1]), int(m[2]))
    elif m := re.search(r"REVIEW-NOTES: (\w+)", line):
        cur["notes"] = m[1]
    elif m := re.search(r"CELLIX-SHAPE: (\w+)", line):
        cur["shape"] = m[1]


def passed(r):
    p = r["probe"]
    return (r["verify"] == 0 and p and p[0] == p[1] and r["notes"] == "PASS"
            and r["shape"] in (None, "PASS"))


print(f"{'task':5} {'base':7} {'cost':>6} {'turns':>5} verify probe   notes shape  result")
for r in rows:
    p = r["probe"]
    print(f"{r['task']:5} {r['base']:7} {('$%.2f' % r['cost']) if r['cost'] is not None else '-':>6} "
          f"{r['turns'] if r['turns'] is not None else '-':>5} {str(r['verify']):6} "
          f"{(f'{p[0]}/{p[1]}' if p else '-'):7} {str(r['notes']):5} {str(r['shape'] or '-'):6} "
          f"{'PASS' if passed(r) else 'FAIL'}")
done = [r for r in rows if r["cost"] is not None]
if done:
    print(f"\n{sum(passed(r) for r in rows)}/{len(rows)} tasks pass every check; "
          f"total ${sum(r['cost'] for r in done):.2f}, mean ${sum(r['cost'] for r in done) / len(done):.2f} per task")
