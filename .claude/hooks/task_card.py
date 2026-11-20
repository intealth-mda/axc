#!/usr/bin/env python3
"""SessionStart hook: a short task card from the repo's task-set-*-requirements.md files,
so the agent reads the right spec whole and names its criterion ids in scenarios from the
start. Suite r30 (iteration 19): 3 of 5 small tasks (bug fix, docs, extend) skipped the
orientation map; F and G first read their spec after precheck failed with "no scenario
names F-AC1...", costing 3-4 turns each, and specs were read in head/sed slices
(H, I, L; every Task B run re-read Task A's spec in 1-3 more calls).
The task's spec is the one the last commit added or changed, or an uncommitted one (a task
set up on a repo that already holds older specs); with none, every spec is listed.
usage: python3 .claude/hooks/task_card.py  (prints SessionStart JSON; silent with no specs)"""
import glob, json, os, re, subprocess, sys

from _common import DOCS, META, NO_BEHAVIOR, criteria

CRIT = re.compile(r"^\|\s*(\w+-AC\d+)\s*\|", re.M)
REF = re.compile(r"\bTask Set ([A-Z])\b")


def card(specs, worked=()):
    """Card text for {file name: text}; `worked` names the task's own spec(s)."""
    if not specs:
        return ""
    letter = {n: m.group(1).upper() for n in specs if (m := re.match(r"task-set-(\w)-", n))}
    def line(n):
        ids = list(dict.fromkeys(CRIT.findall(specs[n])))
        crit = f"criteria {ids[0]}..{ids[-1]} ({len(ids)})" if ids else "no criterion table"
        base = sorted(o for o, l in letter.items() if o != n and l in REF.findall(specs[n]) and l != letter.get(n))
        return n, ids, crit + (f"; builds on {', '.join(base)}" if base else ""), base
    mine = sorted(n for n in specs if n in worked)
    out = ["Task card (from the repo's requirements files):"]
    if mine:
        for n in mine:
            _, ids, desc, base = line(n)
            out.append(f"- This task's spec: {n}, {desc}. Read {'them' if base else 'it'} whole: `cat {' '.join([n, *base])}` alone "
                       "in its own call (joined with the map or greps the output is too large and comes back as a cut preview).")
            if NO_BEHAVIOR.search(specs[n]):
                out.append("- Its Expected Scope says no API behavior change: add no scenarios; the existing suite and the build prove it.")
            elif ids:
                crit = criteria(specs[n])
                tests = [c for c, d in crit.items() if META.match(d) and not DOCS.match(d)]
                docs = [c for c, d in crit.items() if DOCS.match(d)]
                behavior = [c for c in ids if c not in tests and c not in docs]
                span = f"{behavior[0]}..{behavior[-1]}" if behavior == ids[:len(behavior)] else ", ".join(behavior)
                rule = (f"- Precheck and the Stop gate need each behavior id ({span}) named in a scenario of a capability "
                        f"`.feature` (not healthcheck.feature): `Scenario: {behavior[0]} <what it proves>`. Write the scenarios the "
                        "behavior needs; one scenario or outline may name every id it proves.") if behavior else ""
                skip = [f"{', '.join(tests)} (tests: the gate run and the tests you write for the behavior prove them)"] if tests else []
                skip += [f"{', '.join(docs)} (docs: edit the page under apps/docs)"] if docs else []
                out.append(rule + (f" No scenario for {'; '.join(skip)}." if skip else ""))
        others = sorted(set(specs) - set(mine) - {b for n in mine for b in line(n)[3]})
        if others:
            out.append(f"- Other specs in the repo (read only what your prompt names): {', '.join(others)}.")
    else:
        for n in sorted(specs):
            _, _, desc, base = line(n)
            out.append(f"- {n}: {desc}" + (f" (read both: `cat {' '.join([n, *base])}`)." if base else "."))
        out.append("- Read the spec(s) your prompt names whole, with any spec it builds on, in one `cat` call of their own (no head/sed slices). "
                   "Precheck and the Stop gate need every behavior criterion id in the name of a capability `.feature` scenario; "
                   "criteria about tests passing or docs need none.")
    skill = sorted(glob.glob(".claude/skills/*-orientation/SKILL.md"))
    if skill:
        out.append(f"- Load the {skill[0].split('/')[2]} skill (repo map and every check) before writing code.")
    return "\n".join(out)


def main():
    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    os.chdir(root)
    specs = {os.path.basename(f): open(f, errors="replace").read() for f in glob.glob("task-set-*-requirements.md")}
    git = lambda *a: subprocess.run(["git", *a], capture_output=True, text=True).stdout
    worked = {os.path.basename(l[3:].strip().strip('"')) for l in git("status", "--porcelain", "--", "task-set-*-requirements.md").splitlines()}
    worked |= set(git("show", "--name-only", "--format=", "HEAD", "--", "task-set-*-requirements.md").split())
    text = card(specs, worked)
    if text:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": text}}))


if __name__ == "__main__":
    try:
        main()
    except Exception:  # fail open: a card is a help, never a blocker
        pass
    sys.exit(0)
