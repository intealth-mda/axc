#!/usr/bin/env python3
"""One self-check before the full gate. In order: biome --write on changed
files, turbo typecheck + test for every changed package (the same package
scripts verify runs, deps built as verify builds them), then the coverage,
cellix and knip checks. Prints only problems; last line is `precheck OK` or
`precheck FAIL: <steps>`. Exit 0 / 1.
Usage: python3 .claude/hooks/precheck.py"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def run(cmd, root, timeout=600):
    r = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=timeout)
    return r.returncode, ANSI.sub("", (r.stdout or "") + (r.stderr or ""))


def changed(root):
    _, out = run(["git", "status", "--porcelain", "--untracked-files=all", "--", "packages", "apps"], root, 30)
    return [l[3:].split(" -> ")[-1].strip().strip('"') for l in out.splitlines() if l.strip()]


def package_of(root, path):
    """Name of the nearest package.json above path, stopping at the repo root."""
    d = os.path.dirname(path)
    while d:
        pj = os.path.join(root, d, "package.json")
        if os.path.exists(pj):
            return json.load(open(pj)).get("name")
        d = os.path.dirname(d)
    return None


def main():
    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    files = [f for f in changed(root) if os.path.exists(os.path.join(root, f))]
    if not files:
        print("precheck: no changed files under packages/ or apps/")
        return 0
    failed = []

    lintable = [f for f in files if f.endswith((".ts", ".json"))]
    if lintable:
        code, out = run(["corepack", "pnpm", "exec", "biome", "check", "--write", *lintable], root)
        if code:
            failed.append("biome")
            print("-- biome (left after --write) --")
            print("\n".join(l for l in out.splitlines() if l.strip())[-3000:])

    pkgs = sorted({p for p in (package_of(root, f) for f in files if f.endswith(".ts")) if p})
    if pkgs:
        code, out = run(["corepack", "pnpm", "exec", "turbo", "run", "typecheck", "test",
                         "--output-logs=errors-only", *[f"--filter={p}" for p in pkgs]], root)
        if code:
            failed.append("typecheck/test")
            keep = [l for l in out.splitlines()
                    if re.search(r"error|FAIL|✗|×|AssertionError|Expected|Received|Failed:", l)]
            print("-- typecheck/test (" + ", ".join(pkgs) + ") --")
            print("\n".join(keep[:40]) or out[-2000:])

    def coverage_ok(out):  # same bar as the Stop gate: every id named, scenarios >= criteria
        m = re.search(r"(\d+) scenario\(s\), (\d+) criteria", out)
        return bool(m) and int(m[1]) >= int(m[2]) and re.search(r"\): none\s*$", out.strip(), re.M)

    for name, script, args, ok in (("coverage", "coverage_gate.py", ["--check"], coverage_ok),
                                   ("cellix", "cellix_check.py", [], lambda o: re.search(r"cellix check: (OK|no changed source)", o)),
                                   ("knip", "knip_check.py", [], lambda o: "knip: clean" in o)):
        _, out = run([sys.executable, os.path.join(HERE, script), *args], root)
        if not ok(out):
            failed.append(name)
            print(f"-- {name} --")
            print(out.strip())

    print("precheck OK" if not failed else "precheck FAIL: " + ", ".join(failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
