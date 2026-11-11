#!/usr/bin/env python3
"""Harness self-test. Runs at every Claude Code session start (SessionStart hook,
`--session`: silent when all pass, one warning line on drift, never blocks).
1. gate_digest prints `gate EXIT=<n>` first and last and keeps a failing
   scenario's Expected/Received lines.
2. precheck: exits 0 when nothing changed; maps a file to its nearest package;
   flags `{`/`<tag>` outside code in changed docs pages (MDX); the spec check
   lists example-JSON keys missing from the changed source.
3. Drift: each hook rule the axc-orientation map restates still matches the
   script or package it describes. Fix the map or the script when one fails.
Run by hand: python3 .claude/hooks/test_harness.py"""
import glob, json, os, re, subprocess, sys, tempfile

HOOKS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HOOKS))
sys.path.insert(0, HOOKS)
import gate_digest
import precheck
import spec_check

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
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "apps/docs/docs"))
    page = ["\ufeff---", "title: {t}", "---", "# X", "## `GET /x/{id}`", "````md", "```", "{ inner }", "```", "````",
            "> ```", "> {quoted}", "> ```", "| `<id>` | a < b | \\{id\\} |",
            "## GET /x/{id}", "see <Tag>", "a <5 b"]
    open(os.path.join(tmp, "apps/docs/docs/x.md"), "w", encoding="utf-8").write("\n".join(page) + "\n")
    open(os.path.join(tmp, "apps/docs/README.md"), "w").write("{x}\n")
    got = precheck.mdx_problems(tmp, ["apps/docs/docs/x.md", "apps/docs/README.md", "packages/p/src/a.ts"])
    check("precheck: mdx flags braces/tags outside code only", [g.split(":")[1] for g in got] == ["15", "16", "17"])
check("precheck: turbo --continue (one pass lists every failing package)", '"--continue"' in read(".claude/hooks/precheck.py"))
spec_a = "| X-AC1 | lists |\n```json\n{ \"items\": [], \"totalItems\": 1, \"error\": { \"field\": \"q\" } }\n```\n"
spec_b = "| Y-AC1 | creates |\n```json\n{ \"items\": [], \"courseId\": \"c\" }\n```\n```http\nGET /x?a=1\n```\n"
specs = {"task-set-x-requirements.md": spec_a, "task-set-y-requirements.md": spec_b}
drift = {"packages/p/src/list.ts": "return { items, total, error: { field } };",
         "packages/p/src/list.test.ts": "totalItems", "apps/docs/docs/x.md": "`totalItems`",
         "packages/v/src/features/x.feature": "Scenario: X-AC1 lists"}
check("spec: key used only in tests/docs is missing from source", spec_check.pick(specs, drift)
      == ("task-set-x-requirements.md", ["totalItems"]))
check("spec: clean source passes", spec_check.pick(specs, {**drift, "packages/p/src/list.ts": "{ items, totalItems, error: { field } }"})
      == ("task-set-x-requirements.md", []))
check("spec: task picked by criterion ids, not shared keys", spec_check.pick(specs, {
      "packages/p/src/a.ts": "items totalItems field courseId", "packages/v/src/features/y.feature": "Y-AC1"})[0]
      == "task-set-y-requirements.md")
check("spec: no changes -> nothing to check", spec_check.pick(specs, {}) == (None, []))
check("drift: every requirements file has example JSON keys the spec check reads",
      bool(glob.glob(os.path.join(ROOT, spec_check.SPECS))) and all(
          spec_check.keys_of(open(f).read()) for f in glob.glob(os.path.join(ROOT, spec_check.SPECS))))

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
check("drift: CLAUDE.md plan-per-batch line points at the map's write order",
      "one batch at a time (the map's write order)" in read("AGENTS.md")
      and "**Write order**" in skill and "Plan only the batch you are about to write" in skill)

claude_md = read("AGENTS.md")  # the rules live in AGENTS.md; CLAUDE.md imports it
check("drift: CLAUDE.md is exactly the AGENTS.md import", read("CLAUDE.md").strip() == "@AGENTS.md")
check("drift: Copilot pointer names AGENTS.md", "AGENTS.md" in read(".github/copilot-instructions.md"))
check("drift: per-package typecheck row builds deps (turbo), no bare tsgo row",
      "turbo run typecheck test --output-logs=errors-only --filter=@axc/<pkg>" in claude_md
      and not any("tsgo" in l.rstrip().rstrip("|").split("|")[-1] for l in claude_md.splitlines() if l.startswith("|")))
check("drift: mdx rule in map, precheck and CLAUDE.md", "mdx_problems(root, files)" in read(".claude/hooks/precheck.py")
      and "- mdx: changed `apps/docs` pages" in skill and "Pages are MDX" in skill and "knip/mdx" in claude_md)
check("drift: spec rule in map, precheck and CLAUDE.md", '"spec_check.py"' in read(".claude/hooks/precheck.py")
      and "- spec: every key of the requirements file's example JSON" in skill and "knip/mdx/spec" in claude_md)
hc_steps = re.findall(r"^(?:Given|When|Then)\(", read("packages/axc-verification/acceptance-api/src/step-definitions/healthcheck.steps.ts"), re.M)
check("drift: map's 'healthcheck.steps.ts defines only its own three' is true",
      len(hc_steps) == 3 and "healthcheck.steps.ts` defines only its own three" in skill)
chain = "precheck.py && python3 .claude/hooks/gate_digest.py"
check("drift: precheck->gate chain in map and CLAUDE.md", chain in skill.replace("\n  ", " ")
      and chain in claude_md.replace("\n", " "))
import guard
_r = os.path.realpath(ROOT)
_bt = lambda c, cwd=None: guard.bash_write_targets(c, _r, cwd)
check("guard: bash heredoc write to CLAUDE.md is seen", _bt("cat > CLAUDE.md <<'EOF'\nif (a > b) x;\nEOF") == ["CLAUDE.md"])
check("guard: cd and VAR resolve bash write targets",
      _bt("cd packages/axc && A=rest/src; cat > $A/x.ts <<'EOF'\nEOF") == ["packages/axc/rest/src/x.ts"])
check("guard: shell cwd from the event is the starting directory",
      _bt("cat > courses.ts <<'EOF'\nEOF", os.path.join(_r, "packages/axc/application-services/src")) == ["packages/axc/application-services/src/courses.ts"])
check("guard: tee, >> and a harness file", _bt("cd .claude/hooks; echo x >> guard.py; echo y | tee -a ../../pnpm-lock.yaml")
      == [".claude/hooks/guard.py", "pnpm-lock.yaml"])
check("guard: /tmp, /dev/null and unresolvable targets are skipped",
      _bt("echo x > /tmp/y 2>/dev/null; cd $_ && cat > z.ts; cat > $(mktemp)") == [])
check("guard: quoted > and a multi-line sed script are not writes", _bt("grep -n 'a > b' f.ts; sed -i '' '1i\\\nx > y' f.ts") == [])
with tempfile.TemporaryDirectory() as tmp:
    g = lambda *a: subprocess.run(["git", *a], cwd=tmp, capture_output=True, check=True)
    g("init", "-q"); g("config", "user.email", "t@t"); g("config", "user.name", "t")
    os.makedirs(os.path.join(tmp, "packages/p/src"))
    w = lambda f, s: open(os.path.join(tmp, f), "w").write(s)
    w("packages/p/src/a.test.ts", "import x from 'y';\nit('a', () => { expect(1).toBe(1); });\nit('b', () => { expect(2).toBe(2); });\n")
    w("packages/p/src/gone.test.ts", "it('c', () => {});\n")
    w("packages/p/src/x.feature", "Feature: X\n  Scenario: one\n")
    g("add", "-A"); g("commit", "-qm", "base")
    w("packages/p/src/a.test.ts", "import x from 'z';\nit('a', () => { expect(1).toBe(1); });\n")
    os.remove(os.path.join(tmp, "packages/p/src/gone.test.ts"))
    w("packages/p/src/x.feature", "Feature: X\n  Scenario: A-AC1 one\n  Scenario: two\n")
    w("packages/p/src/new.test.ts", "it('n', () => {});\n")
    weak = precheck.tests_weakened(tmp)
    check("precheck: tests flags a weakened and a deleted test, not renames or additions",
          sorted(p.split(":")[0] for p in weak) == ["packages/p/src/a.test.ts", "packages/p/src/gone.test.ts"])
check("drift: tests rule in map, precheck and CLAUDE.md", "tests_weakened(root)" in read(".claude/hooks/precheck.py")
      and "- tests: tests that existed before the task stay intact" in skill and "mdx/spec/tests" in claude_md)
sk = re.search(r"```ts\n(.*?)```", skill, re.S)
listed_asserts = re.search(r"`@serenity-js/assertions` exports exactly: (.*?)\. There is", skill, re.S)
imp = re.search(r"import \{ ([^}]*) \} from '@serenity-js/assertions'", sk[1]) if sk else None
check("drift: steps shape imports only listed serenity assertions", bool(imp and listed_asserts) and
      {n.strip() for n in imp[1].split(",")} <= set(re.findall(r"`(\w+)`", listed_asserts[1])) | {"Ensure"})
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
