#!/usr/bin/env python3
"""Cellix-shape conformance check for one run's code output (hard bar).

Pass/fail on the CellixJS house shapes a reviewer judged as 'Cellix-level':
  - domain context folder: domain/src/domain/contexts/<ctx>/<agg>/
  - inside it: <agg>.aggregate.ts, <agg>.value-objects.ts, <agg>.repository.ts, index.ts
  - colocated tests for the aggregate (and value objects if present)
  - all four layers touched (domain, persistence, application-services, rest)
  - a rest-layer unit test

usage: cellix_shape.py <repo> <base-branch> <out-branch>   (exit 0 = pass)"""
import re, subprocess, sys


def main():
    repo, base, out = sys.argv[1:4]
    files = subprocess.run(["git", "-C", repo, "diff", "--name-only", base, out],
                           capture_output=True, text=True).stdout.split()
    src = [f for f in files if f.startswith("packages/axc/") and "/src/" in f]
    layers = {f.split("/")[2] for f in src}
    ctx = [f for f in src if re.search(r"domain/src/domain/contexts/[^/]+/[^/]+/", f)]
    aggs = {re.search(r"contexts/[^/]+/([^/]+)/", f).group(1) for f in ctx}
    checks = {}
    checks["domain contexts/<ctx>/<agg>/ folder"] = bool(ctx)
    # The house files are read from the finished tree, not the diff: a task that extends an
    # existing aggregate changes only some of its files, and the rest are already in place.
    dirs = {re.search(r"(.*domain/src/domain/contexts/[^/]+/[^/]+)/", f).group(1) for f in ctx}
    tree = set(subprocess.run(["git", "-C", repo, "ls-tree", "-r", "--name-only", out, "--", *sorted(dirs)],
                              capture_output=True, text=True).stdout.split()) if dirs else set()
    ok_files = any(
        all(f"{d}/{d.rsplit('/', 1)[1]}.{kind}.ts" in tree for kind in ("aggregate", "value-objects", "repository"))
        and f"{d}/index.ts" in tree
        for d in dirs)
    checks["<agg>.aggregate/.value-objects/.repository + index.ts"] = ok_files
    checks["colocated aggregate test"] = any(re.search(r"\.aggregate\.test\.ts$", f) for f in ctx)
    checks["all 4 layers (domain, persistence, application-services, rest)"] = \
        {"domain", "persistence", "application-services", "rest"} <= layers
    checks["rest unit test"] = any(f.startswith("packages/axc/rest/src/") and f.endswith(".test.ts") for f in src)
    passed = all(checks.values())
    for k, v in checks.items():
        print(f"  {'ok  ' if v else 'FAIL'} {k}")
    print(f"CELLIX-SHAPE: {'PASS' if passed else 'FAIL'}  ({out})")
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
