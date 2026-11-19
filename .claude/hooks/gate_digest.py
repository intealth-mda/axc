#!/usr/bin/env python3
"""Run the full gate once and print a compact digest: exit code (first and last
line), each gate step, turbo task totals, test and scenario counts, SKIPPED
lines, and on failure the failing step's error lines plus any failing
scenario's Expected/Received. Full log stays at /tmp/verify.log for anything else.
Usage: python3 .claude/hooks/gate_digest.py [gate command...]  (default: pnpm run verify)"""
import os, re, subprocess, sys

LOG = "/tmp/verify.log"
ANSI = re.compile(r"\x1b\[[0-9;]*m")
NOISE = re.compile(r"snyk monitor|DeprecationWarning|trace-deprecation|Tested \d+ dependencies|^✔ Tested /|^Next steps")
# Lines that match "error" but are not failures; 30 of them hid the real one in 6 of the 29
# acceptance failures across 91 A/B runs (iterations 15-18): vitest's per-package "Type Errors  no errors", passing steps
# (a Gherkin step line or a ✓ check whose text says "error code"), source echoed beside a
# warning (`67 │ throw new AppError(...)`), and library stack frames.
PREFIX = re.compile(r"^[\w@/.-]+:[\w:-]+: ?")  # turbo's `@pkg:task: ` on every task line
NOT_ERR = re.compile(r"Type Errors\s+no errors|^(?:[\w@/.-]+:[\w:-]+:)?\s*(?:✓|✔|(?:Given|When|Then|And|But)\s)"
                     r"|^(?:[\w@/.-]+:[\w:-]+:)?\s*\d+(?:\s+\d+)?\s*│|^(?:[\w@/.-]+:[\w:-]+:)?\s*at .*node_modules")


def digest(lines, code):
    out = [f"gate EXIT={code}  (full log: {LOG})"]
    steps = [i for i, l in enumerate(lines) if l.startswith("$ ")][1:]  # [0] is the chain itself
    for n, i in enumerate(steps):
        end = steps[n + 1] if n + 1 < len(steps) else len(lines)
        failed = code != 0 and n == len(steps) - 1
        body = lines[i + 1:end]
        out.append(f"{'FAIL' if failed else 'ok  '} {lines[i][2:][:90]}")
        for l in body:
            s = l.strip()
            if NOISE.search(s):
                continue
            if re.match(r"(Tasks|Failed):\s", s) or re.search(r"\bTests\s+\d+ (passed|failed)|Scenarios:|Steps:|\d+ scenarios? \(|skipp", s, re.I) \
                    or re.search(r"\d+ vulnerabilit|no vulnerable paths", s):
                out.append("     " + re.sub(r"\s+", " ", s)[:140])
        if failed:
            # Expected/Received match after the turbo prefix (serenity prints `Received number: 201`
            # under it; matching at line start dropped every one, so agents saw only the expected
            # half), and the step text after "Step implementation missing:" is kept (r294 grepped
            # the log twice for it).
            errs, after_missing = [], False
            for l in body:
                s = l.strip()
                if after_missing and PREFIX.sub("", l).strip():
                    errs.append(s); after_missing = False; continue
                if (re.search(r"error|✗|×|FAIL|Unused|not ok|ERR_", l, re.I)
                        or re.match(r"\s*(\d+\) Scenario:|Expected|Received)", PREFIX.sub("", l))) \
                        and not NOISE.search(l) and not NOT_ERR.search(s):
                    errs.append(s)
                    after_missing = "implementation missing" in s
            out.append("     -- error lines --")
            out += ["     " + e[:200] for e in errs[:30]]
            out.append("     -- tail --")
            out += ["     " + l.strip()[:200] for l in body[-15:] if l.strip()]
    if not steps:  # single command gate: no '$ ' markers
        out += [l[:200] for l in lines[-40:]]
    seen, uniq = set(), []
    for l in out:  # snyk repeats the same line per project
        if l not in seen or l.startswith(("ok", "FAIL")):
            uniq.append(l)
        seen.add(l)
    if code:
        from _common import fix_hints
        cards = fix_hints("\n".join(lines))
        if cards:
            uniq += ["     -- fix hints --"] + ["     " + c for c in cards]
    uniq.append(f"gate EXIT={code}")  # repeated last: a `| tail` of this output still shows it
    return "\n".join(uniq)


def main():
    cmd = sys.argv[1:] or ["corepack", "pnpm", "run", "verify"]
    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    with open(LOG, "w") as f:
        code = subprocess.run(cmd, cwd=root, stdout=f, stderr=subprocess.STDOUT).returncode
    lines = ANSI.sub("", open(LOG, errors="replace").read()).splitlines()
    print(digest(lines, code))
    sys.exit(code)


if __name__ == "__main__":
    main()
