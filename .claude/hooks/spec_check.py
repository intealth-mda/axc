#!/usr/bin/env python3
"""Spec field-name check (a precheck step): every key in the fenced example
JSON of the task's requirements file must appear in the changed source code.
Runs that read only part of the spec named a response field `total` where the
example says `totalItems`; their own tests, written to their own name, passed,
and the HTTP probe did not (7/10, iterations 14 and r18).

The task's file is the `task-set-*-requirements.md` added or changed by the last
commit or uncommitted (a task set up on a repo that already holds older specs);
when none is, the one whose criterion ids the changed files name most (the
feature tags scenarios with them), then the one whose keys they use most. Keys
the code already had at HEAD (`id`, `createdAt` of an existing response) are not
judged: an extend or bug-fix task reshapes nothing it did not touch (suite r29). Source is every changed file under packages/ or
apps/ except tests, acceptance steps/features and docs: those are written to
the agent's own names, and the response is shaped in source.
usage: python3 .claude/hooks/spec_check.py  (prints `spec check: OK ...` or the
missing keys; exit 0, precheck decides)"""
import glob, os, re, subprocess, sys

from _common import no_behavior_task
from cellix_check import cfg

SPECS = "task-set-*-requirements.md"
KEY = re.compile(r'"([A-Za-z_]\w*)"\s*:')
CRIT = re.compile(r"^\|\s*(\w+-AC\d+)\s*\|", re.M)
NOT_SOURCE = re.compile(r"\.test\.ts$|\.steps\.ts$|\.feature$|\.mdx?$|/step-definitions/|/features/")


def keys_of(text):
    """Keys used in the spec's fenced example blocks."""
    return {k for b in re.findall(r"```[\w-]*\n(.*?)```", text, re.S) for k in KEY.findall(b)}


def pick(specs, work, worked=(), known=()):
    """(spec name, missing keys) for {name: spec text} and {path: changed file text};
    `worked` names the specs the task set up, `known` the keys HEAD source already has."""
    specs = {n: (keys_of(t), set(CRIT.findall(t))) for n, t in specs.items()}
    specs = {n: v for n, v in specs.items() if v[0]}
    specs = {n: v for n, v in specs.items() if n in worked} or specs
    if not specs or not work:
        return None, []
    every = "\n".join(work.values())
    src = "\n".join(t for p, t in work.items() if not NOT_SOURCE.search(p))
    used = lambda k, text: re.search(r"\b%s\b" % re.escape(k), text) is not None
    name = max(sorted(specs), key=lambda n: (sum(used(c, every) for c in specs[n][1]),
                                              sum(used(k, src) for k in specs[n][0]) / len(specs[n][0])))
    return name, sorted(k for k in specs[name][0] if k not in known and not used(k, src))


def main():
    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    if no_behavior_task(root):
        print("spec check: OK, the task declares no API behavior change (no response to shape)")
        return 0
    st = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all", "--", "packages", "apps"],
                        cwd=root, capture_output=True, text=True).stdout
    paths = [l[3:].split(" -> ")[-1].strip().strip('"') for l in st.splitlines() if l.strip()]
    work = {p: open(os.path.join(root, p), errors="replace").read() for p in paths
            if os.path.isfile(os.path.join(root, p))}
    specs = {os.path.basename(f): open(f, errors="replace").read() for f in glob.glob(os.path.join(root, SPECS))}
    git = lambda *a: subprocess.run(["git", *a], cwd=root, capture_output=True, text=True).stdout
    worked = {os.path.basename(l[3:].strip().strip('"')) for l in git("status", "--porcelain", "--", SPECS).splitlines()}
    worked |= set(git("show", "--name-only", "--format=", "HEAD", "--", SPECS).split())
    keys = set().union(*map(keys_of, specs.values()))
    hits = git("grep", "-o", "-w", "-E", "|".join(sorted(keys)), "HEAD", "--", cfg()["packages_root"], "apps").splitlines() if keys else []
    known = {h.split(":", 2)[2] for h in hits if h.count(":") >= 2 and not NOT_SOURCE.search(h.split(":", 2)[1])}
    name, missing = pick(specs, work, worked, known)
    print("spec check: " + ("no spec examples or no changes" if name is None else
          f"OK, every key in the {name} examples is in the source" if not missing else
          f"keys from the {name} example JSON missing from the changed source: " + ", ".join(missing) +
          ". Clients read the exact names the spec shows: rename yours to them (code, tests, docs)."))


if __name__ == "__main__":
    sys.exit(main())
