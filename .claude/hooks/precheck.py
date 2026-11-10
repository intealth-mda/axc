#!/usr/bin/env python3
"""One self-check before the full gate. In order: biome --write on changed
files, turbo typecheck + test for every changed package (the same package
scripts verify runs, deps built as verify builds them), then the coverage,
cellix, knip and mdx checks. turbo runs with --continue, so one pass lists the
errors of every failing package. Prints only problems; last line is `precheck OK` or
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
                         "--continue", "--output-logs=errors-only", *[f"--filter={p}" for p in pkgs]], root)
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

    mdx = mdx_problems(root, files)
    if mdx:
        failed.append("mdx")
        print("-- mdx: `{...}` or `<tag>` outside code breaks the docs build; use backticks or `:id` --")
        print("\n".join(mdx[:20]))

    print("precheck OK" if not failed else "precheck FAIL: " + ", ".join(failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
