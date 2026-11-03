#!/usr/bin/env python3
"""Stop hook: do not finish with changed files outside the write boundary.

guard.py checks file_path on Write/Edit, but headless runs write through Bash
heredocs, where it only sees the command text. This settles the outcome instead:
every changed or untracked path must match allowed_write_globs and no path_deny
rule in guard.config.json (which also locks the vendored packages/cellix/).
Silent when clean. Blocks at most MAX_BLOCKS times per session; fail-open.
Wire to: Stop.
"""
import fnmatch, json, os, re, subprocess, sys

MAX_BLOCKS = 2


def violations(root):
    cfg = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "guard.config.json")))
    globs = cfg.get("allowed_write_globs") or []
    out = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"],
                         cwd=root, capture_output=True, text=True, timeout=10).stdout
    paths = [l[3:].split(" -> ")[-1].strip().strip('"') for l in out.splitlines()]
    # Gate only task sessions, as coverage_gate does: harness-only edits (CLAUDE.md,
    # .claude/) with nothing under packages/ or apps/ are maintenance, not a run.
    if not any(p.startswith(("packages/", "apps/")) for p in paths):
        return []
    bad = []
    for path in paths:
        if globs and not any(fnmatch.fnmatch(path, g) for g in globs):
            bad.append(f"{path}: outside the task's write boundary")
            continue
        for pattern, reason in cfg.get("path_deny", []):
            if re.search(pattern, path, re.I):
                bad.append(f"{path}: {reason}")
                break
    return bad


def main():
    ev = json.loads(sys.stdin.read() or "{}")
    bad = violations(os.environ.get("CLAUDE_PROJECT_DIR") or ev.get("cwd") or os.getcwd())
    if not bad:
        return
    state = os.path.join(os.path.expanduser("~"), ".claude", "metrics", "boundary-gate.json")
    os.makedirs(os.path.dirname(state), exist_ok=True)
    st = json.load(open(state)) if os.path.exists(state) else {}
    sid = ev.get("session_id", "?")
    blocks = st.get(sid, 0)
    if blocks >= MAX_BLOCKS:
        return
    st[sid] = blocks + 1
    json.dump(st, open(state, "w"))
    print(json.dumps({"decision": "block", "reason":
        "Changed files break the write rules:\n" + "\n".join("- " + b for b in bad) +
        "\nRestore them (`git checkout -- <path>` for tracked files) and do the work inside the "
        f"boundary, then finish. (Block {blocks + 1} of {MAX_BLOCKS}.)"}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
