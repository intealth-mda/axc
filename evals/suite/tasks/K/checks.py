"""Task K grader: all-or-nothing bulk status change on the seeded enrollment app (esb-ant-15-b-out-repr232).

The host starts with the six seeded courses and no enrollment requests; every request used here is
created by the probe, one group per criterion. K-AC8/K-AC9 re-check behavior the seed already has.
"""
import glob, os

ER = "/api/enrollment-requests"
BULK = f"{ER}/bulk-status"
J = "I need this course to prepare for upcoming secure development work."
ACTIVE = ["course-001", "course-002", "course-005", "course-006"]
BY = "bulk-reviewer@example.org"


def fields(body):
    det = ((body or {}).get("error") or {}).get("details") if isinstance(body, dict) else None
    return {d.get("field") for d in det if isinstance(d, dict)} if isinstance(det, list) else set()


def failures(body):
    f = ((body or {}).get("error") or {}).get("failures") if isinstance(body, dict) else None
    return [(x.get("id"), x.get("code")) for x in f if isinstance(x, dict)] if isinstance(f, list) else None


def run_checks(api):
    n = [0]

    def create():
        n[0] += 1
        st, b = api.post(ER, {"courseId": ACTIVE[n[0] % 4], "learnerEmail": f"probe-k{n[0]}@example.org", "justification": J})
        return (b or {}).get("id") if st == 201 and isinstance(b, dict) else None

    def get(rid):
        st, b = api.get(f"{ER}/{rid}")
        return b if st == 200 and isinstance(b, dict) else {}

    def state(rid):
        g = get(rid)
        return g.get("status"), len(g.get("statusHistory") or [])

    def untouched(*rids):
        return all(state(r) == ("pending", 1) for r in rids)

    # K-AC1 / K-AC2: bulk approve, then a mixed-from bulk cancel
    p = [create(), create(), create()]
    order = [p[2], p[0], p[1]]
    st, b = api.post(BULK, {"ids": order, "status": "approved", "changedBy": BY})
    items = (b or {}).get("items") if isinstance(b, dict) else None
    got = [x.get("id") for x in items] if isinstance(items, list) else None
    api.rec("K-AC1", "bulk approval returns 200 with all updated requests in submitted order",
            all(p) and st == 200 and got == order and all(x.get("status") == "approved" for x in items)
            and all(state(r)[0] == "approved" for r in p),
            f"status={st} ids={got} code={api.err_code(b)}")

    q = create()
    st2, _ = api.post(BULK, {"ids": [p[0], q], "status": "cancelled", "changedBy": BY})
    h1, hq, h2 = (get(r).get("statusHistory") or [] for r in (p[0], q, p[1]))

    def last(h, frm, to):
        e = h[-1] if h else {}
        return (e.get("fromStatus"), e.get("toStatus"), e.get("changedBy"), e.get("reason")) == (frm, to, BY, None)
    api.rec("K-AC2", "each moved request gets exactly one history entry with from/to/changedBy/reason",
            st == 200 and st2 == 200 and len(h2) == 2 and last(h2, "pending", "approved")
            and len(h1) == 3 and last(h1, "approved", "cancelled") and len(hq) == 2 and last(hq, "pending", "cancelled"),
            f"approve={st} cancel={st2} lens={len(h1)},{len(hq)},{len(h2)} last={[h[-1] if h else None for h in (h1, hq)]}")

    # K-AC3: rejection reason
    r = [create(), create()]
    st1, b1 = api.post(BULK, {"ids": r, "status": "rejected", "changedBy": BY})
    unchanged = untouched(*r)
    reason = "Cohort is full this term."
    st2, b2 = api.post(BULK, {"ids": r, "status": "rejected", "changedBy": BY, "reason": reason})
    ok_reason = all(state(x)[0] == "rejected" and (get(x).get("statusHistory") or [{}])[-1].get("reason") == reason for x in r)
    api.rec("K-AC3", "bulk rejection requires a reason; with one, every entry records it",
            st1 == 400 and api.err_code(b1) == "INVALID_REQUEST" and "reason" in fields(b1) and unchanged
            and st2 == 200 and ok_reason,
            f"without={st1}/{api.err_code(b1)}/{sorted(fields(b1))} unchanged={unchanged} with={st2} recorded={ok_reason}")

    # K-AC4: unknown id
    s = [create(), create()]
    miss = "enroll-missing-k4"
    st, b = api.post(BULK, {"ids": [s[0], miss, s[1]], "status": "approved", "changedBy": BY})
    api.rec("K-AC4", "unknown id fails the batch (409) and changes nothing",
            all(s) and st == 409 and api.err_code(b) == "BULK_STATUS_CHANGE_FAILED"
            and failures(b) == [(miss, "ENROLLMENT_REQUEST_NOT_FOUND")] and untouched(*s),
            f"status={st} code={api.err_code(b)} failures={failures(b)} untouched={untouched(*s)}")

    # K-AC5: invalid transition
    t = [create(), create(), create()]
    sr, _ = api.patch(f"{ER}/{t[2]}/status", {"status": "rejected", "changedBy": BY, "reason": "Not eligible."})
    st, b = api.post(BULK, {"ids": [t[0], t[2], t[1]], "status": "approved", "changedBy": BY})
    api.rec("K-AC5", "invalid transition fails the batch (409) and changes nothing",
            all(t) and sr == 200 and st == 409 and api.err_code(b) == "BULK_STATUS_CHANGE_FAILED"
            and failures(b) == [(t[2], "INVALID_STATUS_TRANSITION")] and untouched(t[0], t[1])
            and state(t[2]) == ("rejected", 2),
            f"status={st} code={api.err_code(b)} failures={failures(b)} untouched={untouched(t[0], t[1])} t3={state(t[2])}")

    # K-AC6: every failure listed, in order, none for passing ids
    ids = [t[0], "enroll-missing-a", t[2], "enroll-missing-b", t[1]]
    want = [("enroll-missing-a", "ENROLLMENT_REQUEST_NOT_FOUND"), (t[2], "INVALID_STATUS_TRANSITION"),
            ("enroll-missing-b", "ENROLLMENT_REQUEST_NOT_FOUND")]
    st, b = api.post(BULK, {"ids": ids, "status": "approved", "changedBy": BY})
    api.rec("K-AC6", "every failing id listed with its own code, in submitted order",
            st == 409 and api.err_code(b) == "BULK_STATUS_CHANGE_FAILED" and failures(b) == want and untouched(t[0], t[1]),
            f"status={st} failures={failures(b)} want={want}")

    # K-AC7: body validation
    v = t[0]
    cases = {"ids:empty": {"ids": [], "status": "approved", "changedBy": BY},
             "ids:not-array": {"ids": v, "status": "approved", "changedBy": BY},
             "ids:missing": {"status": "approved", "changedBy": BY},
             "ids:51": {"ids": [v] + [f"enroll-x{i}" for i in range(50)], "status": "approved", "changedBy": BY},
             "ids:duplicate": {"ids": [v, v], "status": "approved", "changedBy": BY},
             "ids:empty-string": {"ids": [v, ""], "status": "approved", "changedBy": BY},
             "status:unknown": {"ids": [v], "status": "done", "changedBy": BY},
             "changedBy:missing": {"ids": [v], "status": "approved"}}
    res = {}
    for k, body in cases.items():
        st, b = api.post(BULK, body)
        res[k] = st == 400 and api.err_code(b) == "INVALID_REQUEST" and k.split(":")[0] in fields(b)
    st, b = api.post(BULK, raw="{not json")
    res["bad-json"] = st == 400 and api.err_code(b) == "INVALID_REQUEST"
    api.rec("K-AC7", "invalid bodies return 400 INVALID_REQUEST naming the field, nothing changes",
            all(res.values()) and untouched(v), f"failed={[k for k, ok in res.items() if not ok]} untouched={untouched(v)}")

    # K-AC8: single PATCH unchanged
    u1, u2 = create(), create()
    a1, _ = api.patch(f"{ER}/{u1}/status", {"status": "approved", "changedBy": BY})
    a2, b2 = api.patch(f"{ER}/{u1}/status", {"status": "approved", "changedBy": BY})
    a3, b3 = api.patch(f"{ER}/{u2}/status", {"status": "rejected", "changedBy": BY})
    a4, b4 = api.patch(f"{ER}/{u2}/status", {"status": "rejected", "changedBy": BY, "reason": "Prerequisite missing."})
    api.rec("K-AC8", "single-request status change behaves as before",
            a1 == 200 and a2 == 409 and api.err_code(b2) == "INVALID_STATUS_TRANSITION"
            and a3 == 400 and api.err_code(b3) == "INVALID_REQUEST" and a4 == 200 and (b4 or {}).get("status") == "rejected",
            f"approve={a1} again={a2}/{api.err_code(b2)} reject-no-reason={a3}/{api.err_code(b3)} reject={a4}")

    # K-AC9: create / get / list / course search unchanged
    res = {}
    w = create()
    g = get(w)
    res["create+get"] = bool(w) and g.get("status") == "pending" and len(g.get("statusHistory") or []) == 1
    st, b = api.get(f"{ER}?status=pending")
    its = (b or {}).get("items") if isinstance(b, dict) else None
    res["list-status"] = st == 200 and isinstance(its, list) and w in [x.get("id") for x in its] and all(x.get("status") == "pending" for x in its)
    st, b = api.get(f"{ER}?learnerEmail=probe-k{n[0]}@example.org")
    its = (b or {}).get("items") if isinstance(b, dict) else None
    res["list-email"] = st == 200 and isinstance(its, list) and [x.get("id") for x in its] == [w]
    st, b = api.get(f"{ER}/enroll-does-not-exist")
    res["not-found"] = st == 404 and api.err_code(b) == "ENROLLMENT_REQUEST_NOT_FOUND"
    st, b = api.get("/api/courses?status=active&pageSize=50")
    its = (b or {}).get("items") if isinstance(b, dict) else None
    res["course-search"] = st == 200 and isinstance(its, list) and sorted(x.get("id") for x in its) == sorted(ACTIVE)
    st, b = api.get("/api/courses?sort=nope")
    res["course-invalid"] = st == 400 and api.err_code(b) == "INVALID_QUERY_PARAMETER"
    api.rec("K-AC9", "create, get, list and course search behave as before",
            all(res.values()), f"failed={[k for k, ok in res.items() if not ok]}")


def static_checks(repo, api):
    docs = " ".join(open(f, errors="replace").read().lower()
                    for f in glob.glob(os.path.join(repo, "apps/docs/docs/**/*.md"), recursive=True))
    need = ["/api/enrollment-requests/bulk-status", "bulk_status_change_failed", "failures", "ids"]
    missing = [w for w in need if w not in docs]
    api.rec("K-AC12", "docs describe the bulk endpoint, bodies, all-or-nothing rule, failures list and errors",
            not missing, f"docs missing: {missing}")
