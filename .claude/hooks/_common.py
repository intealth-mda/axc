"""Shared helpers for hooks. Import-safe, dependency-free, fail-open."""
import json
import os
import subprocess
import sys

def read_event():
    """Parse the hook payload from stdin. Returns {} if anything is off."""
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except Exception:
        return {}

def project_dir(event=None):
    return (
        os.environ.get("CLAUDE_PROJECT_DIR")
        or (event or {}).get("cwd")
        or os.getcwd()
    )

def state_dir(sub=""):
    """Where hooks keep machine-local state. Global by default so running
    these hooks user-wide never writes into someone's repo; a repo that
    installs the kit locally still gets its own via load_config override."""
    d = os.path.join(os.path.expanduser("~"), ".claude", "metrics", sub)
    os.makedirs(d, exist_ok=True)
    return d


def load_config(name, default):
    """Load <name> from the project's .claude/hooks/ first, then from beside
    this file. Project wins, so a repo can override the global defaults;
    default if neither is readable."""
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (
        os.path.join(project_dir(), ".claude", "hooks", name),
        os.path.join(here, name),
    ):
        try:
            with open(path) as fh:
                return json.load(fh)
        except Exception:
            continue
    return default

def emit(payload):
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()

def deny(event_name, reason):
    """Block the tool call and tell the model why."""
    emit({
        "hookSpecificOutput": {
            "hookEventName": event_name,
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    })
    sys.exit(0)

def ask(event_name, reason):
    emit({
        "hookSpecificOutput": {
            "hookEventName": event_name,
            "permissionDecision": "ask",
            "permissionDecisionReason": reason,
        }
    })
    sys.exit(0)

def allow():
    """Say nothing; normal permission flow continues."""
    sys.exit(0)

def run(cmd, cwd=None, timeout=90):
    """Run a command, never raise. Returns (rc, combined_output)."""
    try:
        p = subprocess.run(
            cmd, shell=isinstance(cmd, str), cwd=cwd, timeout=timeout,
            capture_output=True, text=True,
        )
        return p.returncode, (p.stdout or "") + (p.stderr or "")
    except subprocess.TimeoutExpired:
        return 124, "timeout"
    except Exception as exc:
        return 1, str(exc)


def vault_write(sub, name, content, append=False):
    """Write (or append to) one note in the Obsidian vault, under
    <folder>/<sub>/<name>.md. Fail-open: logging must never break a session.
    Returns the note path, or None if the vault is off or unreachable."""
    try:
        cfg = load_config("vault.config.json", None)
        if not cfg or not cfg.get("enabled") or not os.path.isdir(cfg.get("vault_path", "")):
            return None
        d = os.path.join(cfg["vault_path"], cfg.get("folder", "Claude"), sub)
        os.makedirs(d, exist_ok=True)
        safe = "".join(c for c in name if c not in '\\/:*?"<>|').strip()
        path = os.path.join(d, f"{safe}.md")
        with open(path, "a" if append else "w") as fh:
            fh.write(content)
        return path
    except Exception:
        return None


def vault_log(category, text):
    """Append one timestamped, #claude/<category>-tagged bullet to today's
    daily note in the vault."""
    import time
    day = time.strftime("%Y-%m-%d")
    name = f"Claude Log — {day}"
    line = f"- **{time.strftime('%H:%M')}** #claude/{category} {text}\n"
    # First write of the day gets frontmatter + heading.
    try:
        cfg = load_config("vault.config.json", None)
        if cfg and cfg.get("enabled"):
            p = os.path.join(cfg.get("vault_path", ""), cfg.get("folder", "Claude"),
                             "Daily", f"{name}.md")
            if not os.path.exists(p):
                line = (f"---\ntags: [claude/log]\ndate: {day}\n---\n\n"
                        f"# {name}\n\n") + line
    except Exception:
        pass
    vault_write("Daily", name, line, append=True)


# Rule cards: a one-line fix for a check failure the runs keep repeating. Keyed by the
# error text precheck and gate_digest print; each card prints once.
FIX_HINTS = [
    (r"TS2345: Argument of type 'Expectation<", "Serenity: a string answer takes includes(s); contain(x) is for an array answer."),
    (r"TS1294", "erasableSyntaxOnly: no enum, namespace or constructor parameter properties. Declare the field and assign it in the constructor body; use a string-literal union for an enum."),
    (r"TS2305: Module '\"@axc/", "That name is not exported from the package root: export it from that package's src/index.ts (the only entry other layers and knip see)."),
    (r"TS2305: Module '\"@cellix/", "Wrong seedwork import: use the subpath table in the axc-orientation map."),
    (r"TS2339: Property '\w+' does not exist on type 'ApplicationServices'", "Add the member to the ApplicationServices interface and to the factory object in application-services src/index.ts."),
    (r"TS4114", "noImplicitOverride: write override on a member that overrides a base-class member."),
    (r"TS6133", "Unused declaration: delete it (prefix an unused parameter with _)."),
    (r"TS7030", "noImplicitReturns: every code path returns; end the function with a return or a throw."),
    (r"TS2375|TS2379", "exactOptionalPropertyTypes: omit an undefined optional key with ...(v === undefined ? {} : { k: v }), or type the property T | undefined."),
    (r"Unused exported types?|Unused exports?", "knip: nothing imports that export. Drop export when only its own file uses it; otherwise import it where needed."),
]


def fix_hints(text):
    """Cards whose pattern appears in text, in table order."""
    import re
    return [h for p, h in FIX_HINTS if re.search(p, text)]
