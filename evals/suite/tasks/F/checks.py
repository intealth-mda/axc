"""Task F (bugfix): course tag filter must match case-insensitively, exact tag only."""
import json, os, re, subprocess

C = "/api/courses"


def ids(api, query):
    st, b = api.get(f"{C}?{query}")
    items = b.get("items") if isinstance(b, dict) else None
    return st, ([i.get("id") for i in items] if isinstance(items, list) else None), b


def run_checks(api):
    st, got, _ = ids(api, "tag=AI")
    _, low, _ = ids(api, "tag=ai")
    want = ["course-001", "course-005"]
    api.rec("F-AC1", "tag=AI returns the same courses as tag=ai",
            st == 200 and got == want and low == want, f"tag=AI {st} {got}, tag=ai {low}")

    res = {q: ids(api, q)[:2] for q in ("tag=Security", "tag=sEcUrItY")}
    api.rec("F-AC2", "mixed-case tags match case-insensitively",
            all(s == 200 and i == ["course-001", "course-006"] for s, i in res.values()), res)

    api.rec("F-AC3", "lowercase tag=ai still returns course-001, course-005",
            low == want, f"tag=ai {low}")

    res = {q: ids(api, q)[:2] for q in ("tag=A", "tag=sec")}
    api.rec("F-AC4", "tag filter stays an exact match (partial tags match nothing)",
            all(s == 200 and i == [] for s, i in res.values()), res)

    a = ids(api, "tag=AI&status=active&modality=online")[:2]
    b = ids(api, "tag=SECURITY&q=review")[:2]
    api.rec("F-AC5", "mixed-case tag combines with other filters",
            a == (200, want) and b == (200, ["course-006"]), f"{a} {b}")

    r = ids(api, "q=SECURITY")[:2]
    api.rec("F-AC6", "keyword search unchanged (q=SECURITY)",
            r == (200, ["course-001", "course-003", "course-006"]), r)

    st, got, body = ids(api, "tag=ai&pageSize=1&page=2")
    meta = (body.get("totalItems"), body.get("totalPages")) if isinstance(body, dict) else None
    bad = [api.get(f"{C}?{q}") for q in ("pageSize=0", "modality=x")]
    api.rec("F-AC7", "pagination and validation unchanged",
            st == 200 and got == ["course-005"] and meta == (2, 2)
            and all(s == 400 and api.err_code(x) == "INVALID_QUERY_PARAMETER" for s, x in bad),
            f"page2={st} {got} meta={meta} bad={[(s, api.err_code(x)) for s, x in bad]}")


TEST_FILE = re.compile(r"\.(test|spec|steps)\.ts$|\.feature$")


def static_checks(repo, api):
    # A regression test exists when a test file differs from the seed (tracked or untracked).
    seed = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "meta.json")))["seed"]
    git = lambda *a: subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True).stdout.split()
    changed = git("diff", "--name-only", seed, "--", "apps", "packages") \
        + git("ls-files", "--others", "--exclude-standard", "--", "apps", "packages")
    tests = sorted({f for f in changed if TEST_FILE.search(f)})
    api.rec("F-AC8", "a regression test is added (a test file differs from the seed)",
            bool(tests), "no test file changed relative to the seed")
