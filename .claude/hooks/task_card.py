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

from _common import NO_BEHAVIOR

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
        both = f" (read both: `cat {' '.join([n, *base])}`)" if base else ""
        return n, ids, crit + (f"; builds on {', '.join(base)}{both}" if base else ""), base
    mine = sorted(n for n in specs if n in worked)
    out = ["Task card (from the repo's requirements files):"]
    if mine:
        for n in mine:
            _, ids, desc, base = line(n)
            out.append(f"- This task's spec: {n}, {desc}. Read it whole in one call (`cat`, no head/sed slices).")
            if NO_BEHAVIOR.search(specs[n]):
                out.append("- Its Expected Scope says no API behavior change: add no scenarios; the existing suite and the build prove it.")
            elif ids:
                out.append(f"- Precheck and the Stop gate need every id ({ids[0]}..{ids[-1]}) in the name of a scenario in a capability "
                           f"`.feature` (not healthcheck.feature), and at least as many scenarios as criteria: `Scenario: {ids[0]} <what it proves>`.")
        others = sorted(set(specs) - set(mine))
        if others:
            out.append(f"- Also in the repo (earlier tasks; read only what your prompt names): {', '.join(others)}.")
    else:
        for n in sorted(specs):
            out.append(f"- {n}: {line(n)[2]}.")
        out.append("- Read the spec(s) your prompt names whole in one call, with any spec it builds on (`cat`, no head/sed slices). "
                   "Precheck and the Stop gate need every criterion id in the name of a capability `.feature` scenario.")
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
