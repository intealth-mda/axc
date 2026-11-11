#!/usr/bin/env python3
"""PreToolUse guard: blocks destructive commands and protected-path writes,
including files a Bash command writes through `>`, `>>` or `tee`.

Zero tokens, never ignored. This replaces every "please don't ever..."
line you would otherwise pay for in CLAUDE.md on every single request.

Wire to: PreToolUse, matcher "Bash|Edit|Write|NotebookEdit"
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import read_event, load_config, deny, ask, allow, vault_log  # noqa: E402

EVENT = "PreToolUse"

DEFAULTS = {"bash_deny": [], "bash_ask": [], "path_deny": []}



def strip_heredocs(cmd):
    """Remove INERT heredoc bodies so deny rules match commands, not documents.

    `cat > adr.md <<'EOF' ... EOF` writes text; the text is data, and matching
    rules against it produced real false positives — an architecture decision
    record mentioning an HTTP verb was blocked as an external call, costing a
    measured evaluation run several turns.

    Only heredocs with a QUOTED or ESCAPED delimiter are stripped. With an
    unquoted delimiter bash performs command substitution on the body, so
    `<<EOF` containing $(curl ...) is a live command and MUST stay visible to
    the rules. Stripping those would turn this guard into a bypass.
    """
    if "<<" not in cmd:
        return cmd
    out = []
    lines = cmd.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        i += 1
        # Quoted or escaped delimiter only: <<'E'  <<"E"  <<\E  (and <<- forms)
        m = re.search(r"<<-?\s*(?:'([A-Za-z_][A-Za-z0-9_]*)'"
                      r"|\"([A-Za-z_][A-Za-z0-9_]*)\""
                      r"|\\\\([A-Za-z_][A-Za-z0-9_]*))", line)
        if not m:
            continue
        term = m.group(1) or m.group(2) or m.group(3)
        while i < len(lines) and lines[i].strip() != term:
            i += 1
        i += 1  # drop the terminator too
    return "\n".join(out)

HEREDOC_START = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][\w-]*)\1")
ASSIGN = re.compile(r"^([A-Za-z_]\w*)=(.*)$")
WRITE_OPS = {">", ">>", ">|", "&>", "&>>"}


def drop_heredoc_bodies(cmd):
    """Every heredoc body removed, quoted delimiter or not: a body is file content, and
    a `>` inside it (`if (a > b)`) is not a redirection of the outer command."""
    out, stop = [], None
    for line in cmd.split("\n"):
        if stop is not None:
            if line.strip() == stop:
                stop = None
            continue
        out.append(line)
        m = HEREDOC_START.search(line)
        if m:
            stop = m.group(2)
    return "\n".join(out)


def newlines_to_separators(cmd):
    """Unquoted newlines end a command; quoted ones are part of an argument (a sed script)."""
    out, q, i = [], None, 0
    while i < len(cmd):
        ch = cmd[i]
        if ch == "\\" and q != "'" and i + 1 < len(cmd):
            out.append(cmd[i:i + 2]); i += 2; continue
        if q:
            q = None if ch == q else q
        elif ch in "'\"":
            q = ch
        elif ch == "\n":
            ch = " ; "
        out.append(ch); i += 1
    return "".join(out)


def bash_write_targets(cmd, root, cwd=None):
    """Project-relative paths a Bash command writes through `>`, `>>` or `tee`, resolving
    `cd` and plain `VAR=value` assignments made earlier in the same command, from the
    shell's current directory `cwd` (the hook event's cwd; the Bash tool keeps it across
    calls). Targets
    outside the project (/tmp, /dev/null) and ones it cannot resolve (command
    substitution, unknown variables) are skipped: the Stop-time boundary gate still
    reviews every changed file, so this check only has to be right when it fires."""
    import shlex
    root = os.path.realpath(root)
    cwd, stack, env, found = os.path.realpath(cwd or root), [], {}, []

    def expand(word):
        word = re.sub(r"\$\{(\w+)\}|\$(\w+)", lambda m: env.get(m.group(1) or m.group(2), "\0"), word)
        return None if ("\0" in word or "`" in word or "$(" in word) else os.path.expanduser(word)

    def resolve(word):
        w = expand(word)
        if w is None or (cwd is None and not os.path.isabs(w)):
            return None
        return os.path.normpath(os.path.join(cwd or "/", w))

    try:
        lex = shlex.shlex(newlines_to_separators(drop_heredoc_bodies(cmd)), posix=True, punctuation_chars=True)
        lex.whitespace_split = True
        toks = list(lex)
    except ValueError:
        return []  # unbalanced quotes: leave it to the Stop-time boundary gate
    if True:
        start = True
        i = 0
        while i < len(toks):
            t = toks[i]
            if t == "(":
                stack.append(cwd); start = True
            elif t == ")":
                cwd = stack.pop() if stack else cwd; start = True
            elif t in (";", "&&", "||", "|", "&", ";;"):
                start = True
            elif t in WRITE_OPS and i + 1 < len(toks):
                p = resolve(toks[i + 1]); i += 1
                if p:
                    found.append(p)
                start = False
            elif start and t == "cd":
                if i + 1 < len(toks) and toks[i + 1] not in (";", "&&", "||", "|"):
                    cwd = resolve(toks[i + 1]); i += 1  # None: unknown directory
                start = False
            elif start and ASSIGN.match(t):
                k, v = ASSIGN.match(t).groups()
                v2 = expand(v)
                if v2 is not None:
                    env[k] = v2
                else:
                    env.pop(k, None)
            elif start and t == "tee":
                j = i + 1
                while j < len(toks) and toks[j] not in (";", "&&", "||", "|", "&", ")"):
                    if not toks[j].startswith("-"):
                        p = resolve(toks[j])
                        if p:
                            found.append(p)
                    j += 1
                i = j - 1
                start = False
            else:
                start = False
            i += 1
    rels = []
    for p in found:
        rp = os.path.realpath(p)
        if rp == root or not rp.startswith(root + os.sep):
            continue
        rels.append(os.path.relpath(rp, root).replace(os.sep, "/"))
    return rels


def main():
    event = read_event()
    tool = event.get("tool_name", "")
    ti = event.get("tool_input", {}) or {}
    cfg = load_config("guard.config.json", DEFAULTS)

    if tool == "Bash":
        raw = ti.get("command", "") or ""
        # Match against the command, not against any document it writes.
        cmd = strip_heredocs(raw)
        for pattern, reason in cfg.get("bash_deny", []):
            try:
                # re.M: ^-anchored rules must also match after a newline —
                # re.M: ^-anchored rules must also match after a newline;
                # 'echo hi; <nl> git reset --hard' is two commands, not one.
                if re.search(pattern, cmd, re.I | re.M):
                    vault_log("guard", f"BLOCKED `{cmd[:120]}` — {reason}")
                    deny(EVENT, f"Blocked by guard hook: {reason} "
                                f"Ask the user to run it themselves.")
            except re.error:
                continue
        for pattern, reason in cfg.get("bash_ask", []):
            try:
                if re.search(pattern, cmd, re.I | re.M):
                    ask(EVENT, f"Guard hook wants confirmation: {reason}")
            except re.error:
                continue
        # Files a Bash command writes (heredoc `cat > f`, `>>`, `tee`) meet the same write
        # boundary and path rules as Write/Edit, before the command runs.
        import fnmatch
        from _common import project_dir
        try:
            targets = bash_write_targets(raw, project_dir(event), event.get("cwd"))
        except Exception:
            targets = []   # the Stop-time boundary gate still reviews every changed file
        boundary = cfg.get("allowed_write_globs") or []
        for rel in targets:
            if boundary and not any(fnmatch.fnmatch(rel, g) for g in boundary):
                vault_log("guard", f"BOUNDARY violation blocked (bash write): `{rel}`")
                deny(EVENT, f"Outside the allowed write boundary for this evaluation: {rel} "
                            f"(written by this Bash command). Writable globs: {', '.join(boundary[:6])}. "
                            f"Boundary violations are scored: do the work inside the boundary.")
            for pattern, reason in cfg.get("path_deny", []):
                try:
                    if re.search(pattern, rel, re.I):
                        vault_log("guard", f"BLOCKED bash write to `{rel}` — {reason}")
                        deny(EVENT, f"Blocked by guard hook: {reason} Path: {rel} (written by this Bash command)")
                except re.error:
                    continue

    elif tool in ("Edit", "Write", "NotebookEdit"):
        path = ti.get("file_path") or ti.get("notebook_path") or ""
        norm = path.replace("\\", "/")

        # SRD Allowed Write Boundary: when boundary globs are configured, any
        # write outside them is denied. Boundary violations are a scored
        # Security input in the evaluation rubric, so this fails closed.
        # Per-agent persona boundary (ACH architecture: an agent's persona is
        # "definition, tools, persona (model spec, permitted files)"). The
        # PreToolUse payload carries agent_type when the call comes from a
        # subagent; absent for the main agent. A subagent's own globs REPLACE
        # the task boundary rather than widening it — a persona can only ever
        # be narrower than the sandbox it runs in.
        agent = event.get("agent_type") or ""
        boundary = cfg.get("allowed_write_globs") or []
        per_agent = (cfg.get("agent_write_globs") or {}).get(agent)
        if per_agent is not None:
            if boundary:
                import fnmatch as _fn
                widened = [g for g in per_agent
                           if not any(_fn.fnmatch(g, b) or g == b for b in boundary)]
                if widened:
                    vault_log("guard", f"persona `{agent}` tried to widen boundary: {widened}")
            boundary = (per_agent if not boundary
                        else [g for g in per_agent if g not in (widened or [])])
            # An empty persona means "writes nothing", which is NOT the same as
            # an unset boundary meaning "no restriction configured". Without
            # this, a read-only agent would be allowed everywhere.
            if not boundary:
                vault_log("guard", f"persona `{agent}` is read-only; write denied")
                deny(EVENT, f"Subagent `{agent}` has a read-only persona: it is "
                            f"permitted no write paths at all. Return your "
                            f"findings to the caller instead of writing files.")
        if boundary:
            import fnmatch
            from _common import project_dir
            rel = norm
            root = project_dir(event).replace("\\", "/").rstrip("/")
            if rel.startswith(root + "/"):
                rel = rel[len(root) + 1:]
            if not any(fnmatch.fnmatch(rel, g) for g in boundary):
                who = f"persona `{agent}`" if agent else "main agent"
                vault_log("guard", f"BOUNDARY violation blocked ({who}): `{rel}`")
                deny(EVENT, f"Outside the allowed write boundary for "
                            f"{'subagent ' + agent if agent else 'this evaluation'}"
                            f": {rel}. Writable globs: "
                            f"{', '.join(boundary[:6])}. Boundary violations "
                            f"are scored — do the work inside the boundary or "
                            f"tell the user why it cannot be done there.")
        # Path rules are matched against the project-relative path as well as
        # the absolute one, so a rule can anchor on the repo root (^package\.json$)
        # instead of matching every package.json in the tree.
        try:
            from _common import project_dir as _pd
            _root = _pd(event).replace("\\", "/").rstrip("/")
            _rel = norm[len(_root) + 1:] if norm.startswith(_root + "/") else norm
        except Exception:
            _rel = norm   # never let the relative-path convenience fail the hook open
        for pattern, reason in cfg.get("path_deny", []):
            try:
                if re.search(pattern, norm, re.I) or re.search(pattern, _rel, re.I):
                    vault_log("guard", f"BLOCKED write to `{path}` — {reason}")
                    deny(EVENT, f"Blocked by guard hook: {reason} "
                                f"Path: {path}")
            except re.error:
                continue
        for pattern, reason in cfg.get("path_ask", []):
            try:
                if re.search(pattern, norm, re.I) or re.search(pattern, _rel, re.I):
                    ask(EVENT, f"Guard hook wants confirmation: {reason}")
            except re.error:
                continue

    allow()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # A broken guard must never brick the session.
        sys.exit(0)
