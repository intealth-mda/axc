#!/usr/bin/env python3
"""Eddie's 2026-11-06 review notes as a pass/fail check on a committed output branch.
usage: review_notes_check.py <repo> <config-branch> <output-branch>
  typed domain : no `unknown`/`any` in domain source the run added (tests exempt)
  unit of work : every application-services module the run added/changed that calls .save( uses withScopedTransaction
"""
import re, subprocess, sys
repo, base, out = sys.argv[1:4]
git = lambda *a: subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True).stdout
def code(path):
    s = git("show", f"{out}:{path}")
    s = re.sub(r"/\*.*?\*/|//[^\n]*", "", s, flags=re.S)
    return re.sub(r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`", "''", s)
files = [f for f in git("diff", "--name-only", "--diff-filter=AM", base, out).split()
         if f.startswith("packages/axc/") and f.endswith(".ts") and not f.endswith((".test.ts", ".d.ts"))]
untyped = {f: len(re.findall(r"\b(?:unknown|any)\b", code(f))) for f in files if f.startswith("packages/axc/domain/src/")}
untyped = {f: n for f, n in untyped.items() if n}
unscoped = [f for f in files if f.startswith("packages/axc/application-services/src/")
            and ".save(" in code(f) and "withScopedTransaction" not in code(f)]
uow = sum(code(f).count("withScopedTransaction") for f in files if f.startswith("packages/axc/application-services/src/"))
print(f"  typed domain: {'PASS' if not untyped else 'FAIL ' + str(sum(untyped.values())) + ' in ' + ', '.join(f.split('/')[-1] for f in untyped)}")
print(f"  unit of work: {'PASS' if not unscoped else 'FAIL saves outside in ' + ', '.join(f.split('/')[-1] for f in unscoped)} ({uow} transaction calls)")
print(f"REVIEW-NOTES: {'PASS' if not untyped and not unscoped else 'FAIL'}  ({out})")
