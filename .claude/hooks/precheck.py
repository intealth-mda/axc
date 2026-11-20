#!/usr/bin/env python3
"""One self-check before the full gate. In order: biome --write on changed
files, turbo typecheck + test for every changed package (the same package
scripts verify runs, deps built as verify builds them), then the coverage,
cellix, knip, spec, mdx and tests-intact checks. turbo runs with --continue, so one pass lists the
errors of every failing package. Prints only problems; last line is `precheck OK` or
`precheck FAIL: <steps>`. Exit 0 / 1.
Usage: python3 .claude/hooks/precheck.py"""
import contextlib, io, json, os, re, subprocess, sys

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


MDX_JSX = re.compile(r"(?<!\\)\{|<(?=\S)")
FENCE = re.compile(r"^\s*(?:>\s*)*(`{3,}|~{3,})")


def mdx_problems(root, files):
    """Docs pages are MDX: an unescaped `{` or a `<` not followed by a space, outside
    code, is parsed as JSX and the docs build fails (seen as `ReferenceError: id is not
    defined`). Code spans, fenced blocks (also inside blockquotes) and front matter are
    safe. Known gap: a code span split across two lines is flagged."""
    probs = []
    for f in files:
        if not (f.startswith("apps/docs/docs/") and f.endswith((".md", ".mdx"))):
            continue
        fence, front = "", False
        for n, line in enumerate(open(os.path.join(root, f), encoding="utf-8-sig", errors="replace"), 1):
            if n == 1 and line.strip() == "---":
                front = True
                continue
            if front:
                front = line.strip() != "---"
                continue
            m = FENCE.match(line)
            if m and (not fence or (m[1][0] == fence[0] and len(m[1]) >= len(fence))):
                fence = "" if fence else m[1]
                continue
            if not fence and MDX_JSX.search(re.sub(r"(`+).*?\1", "", line)):
                probs.append(f"{f}:{n}: {line.strip()[:100]}")
    return probs


TEST_FILE = re.compile(r"\.(test|spec)\.ts$|\.feature$|\.steps\.ts$")
# One count per test case or assertion: it()/test() (incl. .each), Scenario lines, expect(), Ensure.that().
TEST_UNITS = re.compile(r"\b(?:it|test)(?:\.each\([^)]*\))?\(|^\s*Scenario(?: Outline)?:|\bexpect\(|\bEnsure\.that\(", re.M)


def tests_weakened(root):
    """Tests that existed before the task and were deleted, or now hold fewer test cases or
    assertions. Adding tests, renaming a scenario or editing imports is fine."""
    _, out = run(["git", "status", "--porcelain", "--", "packages", "apps"], root, 30)
    probs = []
    for line in out.splitlines():
        code, path = line[:2], line[3:].split(" -> ")[0].strip().strip('"')
        if "?" in code or not TEST_FILE.search(path) or path.startswith("packages/cellix/"):
            continue
        _, before = run(["git", "show", f"HEAD:{path}"], root, 30)
        if "D" in code or not os.path.exists(os.path.join(root, path)):
            probs.append(f"{path}: existing test file deleted")
            continue
        n0, n1 = len(TEST_UNITS.findall(before)), len(TEST_UNITS.findall(open(os.path.join(root, path), errors="replace").read()))
        if n1 < n0:
            probs.append(f"{path}: {n0} test cases/assertions before the task, {n1} now")
    return probs


def test_errors(out):
    """Failure lines of a turbo typecheck/test run. Case-insensitive: vitest prints the cause as
    `TypeCheckError: ...`/`TypeError: ...` and its place as `❯ src/x.test.ts:10:55`; a lowercase-only
    match kept just the FAIL name, so E (suite r30) opened the test file twice to learn why."""
    from gate_digest import NOT_ERR
    return [l for l in out.splitlines() if re.search(r"error|FAIL|✗|×|Expected|Received|Failed:|❯ src/", l, re.I)
            and not NOT_ERR.search(l.strip()) and "WARNING  command finished" not in l]


def _main():
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
                         "--continue", "--output-logs=errors-only", *[f"--filter={p}" for p in pkgs]], root)
        if code:
            failed.append("typecheck/test")
            print("-- typecheck/test (" + ", ".join(pkgs) + ") --")
            print("\n".join(test_errors(out)[:40]) or out[-2000:])

    def coverage_ok(out):  # same bar as the Stop gate: every behavior id named, docs changed
        return re.search(r"\): none\s*$", out.strip(), re.M)

    for name, script, args, ok in (("coverage", "coverage_gate.py", ["--check"], coverage_ok),
                                   ("cellix", "cellix_check.py", [], lambda o: re.search(r"cellix check: (OK|no changed source)", o)),
                                   ("knip", "knip_check.py", [], lambda o: "knip: clean" in o),
                                   ("spec", "spec_check.py", [], lambda o: re.search(r"spec check: (OK|no spec)", o))):
        _, out = run([sys.executable, os.path.join(HERE, script), *args], root)
        if not ok(out):
            failed.append(name)
            print(f"-- {name} --")
            print(out.strip())

    mdx = mdx_problems(root, files)
    if mdx:
        failed.append("mdx")
        print("-- mdx: `{...}` or `<tag>` outside code breaks the docs build; use backticks or `:id` --")
        print("\n".join(mdx[:20]))

    weak = tests_weakened(root)
    if weak:
        failed.append("tests")
        print("-- tests: existing tests must stay intact; add new tests instead of removing or weakening these --")
        print("\n".join(weak))

    print("precheck OK" if not failed else "precheck FAIL: " + ", ".join(failed))
    return 1 if failed else 0


def main():
    """_main's report, with the rule cards for its failures above the last line."""
    from _common import fix_hints
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = _main()
    out = buf.getvalue().rstrip("\n").split("\n")
    cards = fix_hints("\n".join(out)) if code else []
    if cards:
        out[-1:-1] = ["-- fix hints --"] + ["  " + c for c in cards]
    print("\n".join(out))
    return code


if __name__ == "__main__":
    sys.exit(main())
