#!/usr/bin/env python3
"""Harness self-test. Runs at every Claude Code session start (SessionStart hook,
`--session`: silent when all pass, one warning line on drift, never blocks).
1. gate_digest prints `gate EXIT=<n>` first and last and keeps a failing
   scenario's Expected/Received lines.
2. precheck: exits 0 when nothing changed; maps a file to its nearest package.
3. Drift: each hook rule the axc-orientation map restates still matches the
   script or package it describes. Fix the map or the script when one fails.
Run by hand: python3 .claude/hooks/test_harness.py"""
import glob, json, os, re, subprocess, sys, tempfile

HOOKS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HOOKS))
sys.path.insert(0, HOOKS)
import gate_digest
import precheck

fails = []
SESSION = "--session" in sys.argv


def check(name, cond):
    if not SESSION:
        print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        fails.append(name)


def read(*p):
    return open(os.path.join(ROOT, *p)).read()


ok = gate_digest.digest(["$ chain", "$ biome check .", "Checked 1 files"], 0).splitlines()
check("digest: EXIT first and last on pass", ok[0].startswith("gate EXIT=0") and ok[-1] == "gate EXIT=0")
bad = gate_digest.digest(["$ chain", "$ cucumber-js", "Failures:", "1) Scenario: X-AC1 bad # f.feature:3",
                          "   ✖ Then status is 400", "      Expected 400", "      Received 200",
                          "1 scenario (1 failed)"], 1).splitlines()
check("digest: EXIT last on fail", bad[-1] == "gate EXIT=1")
check("digest: failing scenario kept", any("1) Scenario: X-AC1" in l for l in bad))
check("digest: Expected/Received kept", any("Expected 400" in l for l in bad) and any("Received 200" in l for l in bad))

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["git", "init", "-q"], cwd=tmp, check=True)
    r = subprocess.run([sys.executable, os.path.join(HOOKS, "precheck.py")], cwd=tmp, capture_output=True,
                       text=True, env=dict(os.environ, CLAUDE_PROJECT_DIR=tmp))
    check("precheck: no changes -> exit 0 with notice", r.returncode == 0 and "no changed files" in r.stdout)
    os.makedirs(os.path.join(tmp, "packages/p/src/a"))
    json.dump({"name": "@x/p"}, open(os.path.join(tmp, "packages/p/package.json"), "w"))
    check("precheck: file maps to nearest package", precheck.package_of(tmp, "packages/p/src/a/b.ts") == "@x/p")
check("precheck: turbo --continue (one pass lists every failing package)", '"--continue"' in read(".claude/hooks/precheck.py"))

skill = read(".claude/skills/axc-orientation/SKILL.md")
cellix = read(".claude/hooks/cellix_check.py")
cov = read(".claude/hooks/coverage_gate.py")
check("drift: seed/fixture exemption", "(seed|fixture)" in cellix and "`seed` or `fixture`" in skill)
check("drift: five aggregate files", all(s in cellix for s in
      ('.aggregate.ts"', '.value-objects.ts"', '.repository.ts"', '"index.ts"', '.aggregate.test.ts"')))
check("drift: rest unit test rule", "rest/src/" in cellix and "at least one rest `src/*.test.ts`" in skill)
check("drift: typed-domain and unit-of-work rules", "(unknown|any)" in cellix and "withScopedTransaction" in cellix
      and "no `unknown`/`any` in domain source" in skill and "calls `withScopedTransaction`" in skill)
check("drift: map's InMemoryUnitOfWork is exported", "InMemoryUnitOfWork" in read("packages/axc/persistence/src/index.ts"))
check("drift: coverage bar", "n >= len(crit)" in cov and "at least as many scenarios as criteria" in skill)
check("drift: healthcheck.feature excluded", '"healthcheck.feature"' in cov and "not `healthcheck.feature`" in skill)

exports = json.loads(read("packages/cellix/domain-seedwork/package.json"))["exports"]
listed = re.findall(r"`@cellix/domain-seedwork/([\w-]+)`", skill)
check("drift: map's seedwork subpaths exist, no root export",
      bool(listed) and all(f"./{p}" in exports for p in listed) and "." not in exports)

m = re.search(r"`@serenity-js/assertions` exports exactly: (.*?)\. There is", skill, re.S)
libs = glob.glob(os.path.join(ROOT, "node_modules/.pnpm/@serenity-js+assertions@*/node_modules/"
                                    "@serenity-js/assertions/lib/expectations"))
if m and libs:
    real = {f[:-5] for f in os.listdir(libs[0]) if f.endswith(".d.ts") and f != "index.d.ts"}
    check("drift: map lists exactly the installed serenity assertions", set(re.findall(r"`(\w+)`", m[1])) == real)
else:
    check("drift: serenity assertion list present (run pnpm install first)", False)

if SESSION:
    if fails:
        print("harness drift: " + "; ".join(fails) + ". The map or a hook is stale; "
              "run python3 .claude/hooks/test_harness.py and fix before relying on the map.")
    sys.exit(0)
print(f"{len(fails)} failed" if fails else "harness self-test: all passed")
sys.exit(1 if fails else 0)
