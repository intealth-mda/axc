#!/usr/bin/env python3
"""Stop hook + self-check CLI: do not finish while the acceptance feature covers
fewer scenarios than the task defines acceptance criteria.

Iteration 5 proved the count check (12/12 scenarios in 3/3 runs vs a 5-17 swing
without it) but blocked twice every run at +22% cost: the message said how many
scenarios were missing, not which criteria, so the agent guessed. This version
names the uncovered criteria - a criterion counts as covered once its id
(e.g. A-AC7) appears in a non-healthcheck feature file - and tells the agent to
tag each scenario with its criterion id, so the next check is exact.

Also runnable by the agent as `python3 .claude/hooks/coverage_gate.py --check`
to list uncovered criteria before stopping (read-only, exit 0).

Blocks at most MAX_BLOCKS times per session, then lets the agent stop (and says
so), so a stubborn mismatch can never deadlock a run. Fail-open on any error.
Wire to: Stop.
"""
import glob, json, os, re, subprocess, sys

from _common import DOCS, META, criteria, no_behavior_task

MAX_BLOCKS = 2

FEATURES = "packages/axc-verification/acceptance-api/src/features"

def committed_ids(root):
    """criterion ids the committed capability features already name. A table they fully
    cover belongs to a task already done (the app the work starts from), not this one."""
    try:
        r = subprocess.run(["git", "grep", "-h", "-o", "-i", "-E", r"[A-Z]+-AC[0-9]+", "HEAD", "--",
                            f"{FEATURES}/*.feature", f":!{FEATURES}/healthcheck.feature"],
                           cwd=root, capture_output=True, text=True, timeout=10)
        return {i.upper() for i in r.stdout.split()}
    except Exception:
        return set()

def docs_changed(root):
    """apps/docs changed in the working tree or the last commit.
    ponytail: an older commit's docs change misses; widen to a base ref if tasks commit in steps."""
    try:
        git = lambda *a: subprocess.run(["git", *a, "--", "apps/docs"], cwd=root, capture_output=True, text=True, timeout=10).stdout.strip()
        return bool(git("status", "--porcelain") or git("show", "--name-only", "--format=", "HEAD"))
    except Exception:
        return True

def scan(root):
    """criteria from the requirements table of ONE task (the one being worked); which ids
    the features mention; scenario count (healthcheck excluded); scenarios needed.
    Test and docs criteria (META) need no scenario: the gate run proves the test ones, and a
    docs one is missing only while apps/docs is unchanged.

    The repo root holds a requirements file per task (ids `<X>-AC<n>`, any task letter).
    Summing them makes the gate unsatisfiable for an agent working one task, so criteria
    are read per file. Tables the committed features already fully cover are skipped
    (tasks done before this one); of the rest the gate scores the one with the most ids
    named in the features, then the fewest criteria."""
    # A docs or refactor task (spec: no API behavior change) adds no scenarios; the existing
    # suite and the build prove it. Suite task H wrote a feature file and steps (4 files,
    # +97 lines vs +26) only for this gate. Skipping just its table let the gate fall back
    # to Task A's table (r28), so the whole gate stands down.
    if no_behavior_task(root):
        return {}, [], 0, 0
    tables = []  # one {id: description} per requirements file
    for req in sorted(glob.glob(os.path.join(root, "task-set-*-requirements.md"))):
        t = {c: d for c, d in criteria(open(req, errors="replace").read()).items() if not META.match(d) or DOCS.match(d)}
        if t:
            tables.append(t)
    done = committed_ids(root)
    tables = [t for t in tables if not {c.upper() for c, d in t.items() if not DOCS.match(d)} <= done]
    if not tables:
        return {}, [], 0, 0
    text, n = "", 0
    for f in glob.glob(os.path.join(root, FEATURES, "*.feature")):
        if os.path.basename(f) == "healthcheck.feature":
            continue
        body = open(f, errors="replace").read()
        text += "\n" + body
        n += len(re.findall(r"^\s*Scenario(?: Outline)?:", body, re.M))
    def hit(c):
        return bool(re.search(r"\b%s\b" % re.escape(c), text, re.I))
    crit = max(tables, key=lambda t: (sum(hit(c) for c in t), -len(t)))
    docs = {c for c, d in crit.items() if DOCS.match(d)}
    docs_ok = not docs or docs_changed(root)
    missing = [c for c in sorted(crit, key=lambda s: int(re.sub(r"\D", "", s)))
               if (c in docs and not docs_ok) or (c not in docs and not hit(c))]
    return crit, missing, n, len(crit) - len(docs)

def main():
    try:
        ev = json.loads(sys.stdin.read() or "{}")
    except Exception:
        return
    # stop_hook_active is true on every re-stop after a block. Returning early
    # here would make the gate fire once and then pass a still-short feature;
    # the per-session MAX_BLOCKS counter below is what prevents an endless loop.
    root = os.environ.get("CLAUDE_PROJECT_DIR") or ev.get("cwd") or os.getcwd()
    # Gate only sessions that did task work. A session with no modified or new
    # files under packages/ or apps/ (config cleanup, questions, docs) has no
    # coverage obligation; blocking it loops interactive users forever.
    try:
        st = subprocess.run(["git", "status", "--porcelain", "--", "packages", "apps"],
                            cwd=root, capture_output=True, text=True, timeout=10)
        if st.returncode == 0 and not st.stdout.strip():
            return
    except Exception:
        pass
    crit, missing, n, need = scan(root)
    if not crit:
        return
    # pass bar: every behavior criterion id named in a capability feature file, and docs
    # criteria with an apps/docs change. No scenario-count bar: r31 B named all 12 ids in 11
    # scenarios (one merged, as the card allows) and the count made it split one to pad.
    if not missing:
        return

    state = os.path.join(os.path.expanduser("~"), ".claude", "metrics", "coverage-gate.json")
    try:
        os.makedirs(os.path.dirname(state), exist_ok=True)
        st = json.load(open(state)) if os.path.exists(state) else {}
    except Exception:
        st = {}
    sid = ev.get("session_id", "?")
    entry = st.get(sid, 0)
    if isinstance(entry, int):  # legacy state shape
        entry = {"blocks": entry, "notified": False}
    blocks = int(entry.get("blocks", 0))
    if blocks >= MAX_BLOCKS:
        if not entry.get("notified"):
            entry["notified"] = True
            st[sid] = entry
            try:
                json.dump(st, open(state, "w"))
            except Exception:
                pass
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "Stop", "additionalContext":
                  f"Coverage gate: {n} acceptance scenario(s) for {need} behavior criteria; limit of {MAX_BLOCKS} blocks reached, "
                  f"allowing stop. State the gap explicitly in your summary. (This notice is sent once.)"}}))
        return
    st[sid] = {"blocks": blocks + 1, "notified": False}
    try:
        json.dump(st, open(state, "w"))
    except Exception:
        pass
    gaps = "\n".join(f"- {c}: {crit[c]}" + (" (docs: change its page under apps/docs, no scenario)" if DOCS.match(crit[c]) else "")
                     for c in missing)
    print(json.dumps({"decision": "block", "reason":
        f"Acceptance coverage is incomplete: {n} scenario(s) in packages/axc-verification/acceptance-api/src/features "
        f"against {need} behavior criteria in the task requirements file. Criteria not yet covered:\n{gaps}\n"
        f"Add a scenario for each behavior criterion above using the existing step-definition pattern and put the criterion id "
        f"in the scenario name (e.g. `Scenario: A-AC8 invalid query parameters return 400`). Verify with "
        f"`python3 .claude/hooks/coverage_gate.py --check`, run "
        f"`corepack pnpm --filter @axc-verification/acceptance-api run test:acceptance`, then finish. "
        f"(Block {blocks + 1} of {MAX_BLOCKS}.)"}))

if __name__ == "__main__":
    if "--check" in sys.argv:
        crit, missing, n, need = scan(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
        print(f"{n} scenario(s), {need} criteria.")
        print("Uncovered (behavior id not named in a scenario, or docs id with apps/docs unchanged): " + (", ".join(missing) or "none"))
        sys.exit(0)
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
