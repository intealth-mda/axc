"""Task L (feature): GET /api/enrollment-requests/{id}/history.csv."""
import csv, glob, io, os

EP = "/api/enrollment-requests"
J = "I need this course to prepare for upcoming secure development work."
HEADER = "changedAt,fromStatus,toStatus,changedBy,reason"
COLS = HEADER.split(",")


def enc(v):
    s = "" if v is None else str(v)
    return '"' + s.replace('"', '""') + '"' if any(c in s for c in ',"\r\n') else s


def expected(hist):
    return "".join(",".join(enc(h.get(c)) for c in COLS) + "\r\n" for h in [dict(zip(COLS, COLS))] + hist)


def export(api, rid):
    st, body = api.get(f"{EP}/{rid}/history.csv")
    return st, body if isinstance(body, str) else None, dict(api.headers)


def make(api, course, email, steps):
    _, b = api.post(EP, {"courseId": course, "learnerEmail": email, "justification": J})
    rid = (b or {}).get("id")
    for s in steps:
        api.patch(f"{EP}/{rid}/status", s)
    _, full = api.get(f"{EP}/{rid}")
    return rid, (full.get("statusHistory") if isinstance(full, dict) else None) or []


def run_checks(api):
    rev = "reviewer@example.org"
    id1, h1 = make(api, "course-001", "l-probe-1@example.org", [
        {"status": "approved", "changedBy": rev},
        {"status": "cancelled", "changedBy": rev, "reason": 'Schedule conflict, "Q3" cohort'}])
    id2, h2 = make(api, "course-002", "l-probe-2@example.org", [
        {"status": "rejected", "changedBy": "Ops, Team", "reason": "Line one\nLine two"}])
    if not id1 or len(h1) != 3 or not id2 or len(h2) != 2:
        api.rec("L-AC1", "history.csv returns 200 text/csv", False, f"setup failed: {id1} {len(h1)} {id2} {len(h2)}")
        return

    st, body, hd = export(api, id1)
    ctype = hd.get("content-type", "").lower().replace(" ", "")
    api.rec("L-AC1", "history.csv returns 200 with Content-Type text/csv; charset=utf-8",
            st == 200 and body is not None and ctype.startswith("text/csv") and "charset=utf-8" in ctype,
            f"status={st} content-type={hd.get('content-type')}")
    body = body or ""

    api.rec("L-AC2", "first line is the exact header row",
            body.splitlines()[:1] == [HEADER], f"first line={body.splitlines()[:1]}")

    rows = list(csv.reader(io.StringIO(body, newline="")))
    want = [[h.get(c) or "" for c in COLS] for h in h1]
    api.rec("L-AC3", "one row per statusHistory entry, in order, values equal to get-by-id",
            rows[1:] == want, f"rows={rows[1:]} want={want}"[:300])

    first = body.replace("\r\n", "\n").split("\n")[1:2]
    api.rec("L-AC4", "null values are empty fields (creation row)",
            first == [f"{h1[0].get('changedAt')},,pending,system,"], f"creation row={first}")

    _, body2, _ = export(api, id2)
    norm = lambda s: (s or "").replace("\r\n", "\n")
    api.rec("L-AC5", "comma, double quote and line feed fields are quoted, others are not",
            norm(body) == norm(expected(h1)) and norm(body2) == norm(expected(h2)),
            f"got={norm(body2)!r} want={norm(expected(h2))!r}"[:300])

    api.rec("L-AC6", "every line, including the last, ends with CRLF",
            body.endswith("\r\n") and body.count("\n") == body.count("\r\n") == len(h1) + 1,
            f"tail={body[-12:]!r} lf={body.count(chr(10))} crlf={body.count(chr(13) + chr(10))}")

    want_cd = f'attachment; filename="enrollment-request-{id1}-history.csv"'
    api.rec("L-AC7", "Content-Disposition names the request's file",
            hd.get("content-disposition") == want_cd, f"got {hd.get('content-disposition')!r}")

    st, b = api.get(f"{EP}/no-such-request/history.csv")
    api.rec("L-AC8", "unknown id returns 404 ENROLLMENT_REQUEST_NOT_FOUND (JSON)",
            st == 404 and api.err_code(b) == "ENROLLMENT_REQUEST_NOT_FOUND", f"status={st} code={api.err_code(b)}")

    sg, g = api.get(f"{EP}/{id1}")
    sl, l = api.get(f"{EP}?courseId=course-001")
    api.rec("L-AC9", "existing JSON endpoints unchanged",
            sg == 200 and isinstance(g, dict) and isinstance(g.get("statusHistory"), list)
            and sl == 200 and isinstance(l, dict) and id1 in [i.get("id") for i in l.get("items") or []],
            f"get={sg} list={sl}")


def static_checks(repo, api):
    docs = "".join(open(p, encoding="utf-8").read() for ext in ("md", "mdx")
                   for p in glob.glob(os.path.join(repo, f"apps/docs/docs/**/*.{ext}"), recursive=True))
    api.rec("L-AC10", "docs describe /history.csv and its header row",
            "/history.csv" in docs and HEADER in docs, "docs lack /history.csv or the header row")
