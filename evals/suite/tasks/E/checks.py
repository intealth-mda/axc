"""Task E grader: course capacity on the seeded courses + enrollment app (esb-ant-15-b-out-repr232).

The host starts with the six seeded courses and no enrollment requests. Each criterion uses its
own course so one failure does not cascade. E-AC7..E-AC9 re-check behavior the seed already has.
"""
import glob, os

ER = "/api/enrollment-requests"
CAP = {"course-001": 2, "course-002": 1, "course-003": 15, "course-004": 20, "course-005": 3, "course-006": 25}
J = "I need this course to prepare for upcoming secure development work."
REV = "reviewer@example.org"


def run_checks(api):
    n = [0]

    def create(course):
        n[0] += 1
        st, b = api.post(ER, {"courseId": course, "learnerEmail": f"probe-e{n[0]}@example.org", "justification": J})
        return st, (b or {}).get("id") if isinstance(b, dict) else None

    def move(rid, status, reason=None):
        body = {"status": status, "changedBy": REV}
        if reason:
            body["reason"] = reason
        return api.patch(f"{ER}/{rid}/status", body)

    def avail(course):
        st, b = api.get(f"/api/courses/{course}/availability")
        b = b if isinstance(b, dict) else {}
        return st, {k: b.get(k) for k in ("courseId", "capacity", "approvedCount", "pendingCount", "seatsLeft")}

    st, b = api.get("/api/courses?pageSize=50")
    got = {c.get("id"): c.get("capacity") for c in ((b or {}).get("items") or [])} if isinstance(b, dict) else {}
    api.rec("E-AC1", "every seeded course carries the specified capacity",
            st == 200 and got == CAP, f"status={st} capacities={got}")

    st, a = avail("course-005")
    api.rec("E-AC2", "availability with no requests is full capacity",
            st == 200 and a == {"courseId": "course-005", "capacity": 3, "approvedCount": 0, "pendingCount": 0, "seatsLeft": 3},
            f"status={st} body={a}")

    st, b = api.get("/api/courses/course-999/availability")
    api.rec("E-AC3", "availability for unknown course returns 404 COURSE_NOT_FOUND",
            st == 404 and api.err_code(b) == "COURSE_NOT_FOUND", f"status={st} code={api.err_code(b)}")

    _, r1 = create("course-005")
    _, r2 = create("course-005")
    sp, _ = move(r1, "approved")
    st, a = avail("course-005")
    api.rec("E-AC4", "availability counts approved and pending requests",
            sp == 200 and st == 200 and a == {"courseId": "course-005", "capacity": 3, "approvedCount": 1, "pendingCount": 1, "seatsLeft": 2},
            f"approve={sp} status={st} body={a}")

    _, a1 = create("course-002")
    _, a2 = create("course-002")
    s1, _ = move(a1, "approved")
    s2, b2 = move(a2, "approved")
    sg, g = api.get(f"{ER}/{a2}")
    g = g if isinstance(g, dict) else {}
    api.rec("E-AC5", "approving with no seats left returns 409 COURSE_FULL and leaves the request unchanged",
            s1 == 200 and s2 == 409 and api.err_code(b2) == "COURSE_FULL"
            and g.get("status") == "pending" and len(g.get("statusHistory") or []) == 1,
            f"first={s1} second={s2}/{api.err_code(b2)} after={g.get('status')} history={len(g.get('statusHistory') or [])}")

    s3, _ = move(a1, "cancelled")
    s4, b4 = move(a2, "approved")
    st, a = avail("course-002")
    api.rec("E-AC6", "cancelling an approved request frees its seat",
            s3 == 200 and s4 == 200 and (b4 or {}).get("status") == "approved"
            and a == {"courseId": "course-002", "capacity": 1, "approvedCount": 1, "pendingCount": 0, "seatsLeft": 0},
            f"cancel={s3} approve={s4}/{api.err_code(b4)} availability={st}/{a}")

    # course-001 (capacity 2): fill it, then the non-approval actions must still work
    _, f1 = create("course-001")
    _, f2 = create("course-001")
    fa, fb = move(f1, "approved")[0], move(f2, "approved")[0]
    c3, f3 = create("course-001")
    rj, rb = move(f3, "rejected", "Course is full this term.") if f3 else (None, {})
    c4, f4 = create("course-001")
    cn, cb = move(f4, "cancelled") if f4 else (None, {})
    api.rec("E-AC7", "full course still accepts new pending requests, rejections and cancellations",
            fa == fb == 200 and c3 == 201 and rj == 200 and (rb or {}).get("status") == "rejected"
            and c4 == 201 and cn == 200 and (cb or {}).get("status") == "cancelled",
            f"fill={fa},{fb} create={c3} reject={rj} create={c4} cancel={cn}")

    # existing enrollment behavior on course-006 (capacity 25)
    res = {}
    st, b = api.post(ER, {"courseId": "course-006", "learnerEmail": "probe-e-dup@example.org", "justification": J})
    rid = (b or {}).get("id") if isinstance(b, dict) else None
    res["create"] = st == 201 and (b or {}).get("status") == "pending"
    st, b = api.post(ER, {"courseId": "course-006", "learnerEmail": "probe-e-dup@example.org", "justification": J})
    res["duplicate"] = st == 409 and api.err_code(b) == "DUPLICATE_ACTIVE_REQUEST"
    res["approve"] = move(rid, "approved")[0] == 200
    st, b = move(rid, "approved")
    res["invalid-transition"] = st == 409 and api.err_code(b) == "INVALID_STATUS_TRANSITION"
    _, r5 = create("course-006")
    st, b = move(r5, "rejected")
    res["reject-no-reason"] = st == 400 and api.err_code(b) == "INVALID_REQUEST"
    st, b = api.post(ER, {"courseId": "course-003", "learnerEmail": "probe-e-draft@example.org", "justification": J})
    res["draft-course"] = st == 409 and api.err_code(b) == "COURSE_NOT_ACTIVE"
    st, b = api.post(ER, {"courseId": "course-999", "learnerEmail": "probe-e-none@example.org", "justification": J})
    res["missing-course"] = st == 404 and api.err_code(b) == "COURSE_NOT_FOUND"
    st, b = api.post(ER, {"courseId": "course-006", "learnerEmail": "nope", "justification": J})
    res["bad-email"] = st == 400 and api.err_code(b) == "INVALID_REQUEST"
    api.rec("E-AC8", "existing enrollment request behavior is unchanged",
            all(res.values()), f"failed={[k for k, v in res.items() if not v]}")

    res = {}
    st, b = api.get("/api/courses?status=active&pageSize=50")
    b = b if isinstance(b, dict) else {}
    res["status"] = st == 200 and sorted(c.get("id") for c in b.get("items") or []) == ["course-001", "course-002", "course-005", "course-006"]
    st, b = api.get("/api/courses?modality=online&pageSize=50")
    b = b if isinstance(b, dict) else {}
    res["modality"] = st == 200 and sorted(c.get("id") for c in b.get("items") or []) == ["course-001", "course-005", "course-006"]
    st, b = api.get("/api/courses?page=2&pageSize=4")
    b = b if isinstance(b, dict) else {}
    res["pagination"] = st == 200 and len(b.get("items") or []) == 2 and (b.get("page"), b.get("pageSize"), b.get("totalItems"), b.get("totalPages")) == (2, 4, 6, 2)
    st, b = api.get("/api/courses?pageSize=99")
    res["invalid"] = st == 400 and api.err_code(b) == "INVALID_QUERY_PARAMETER"
    api.rec("E-AC9", "existing course search behavior is unchanged",
            all(res.values()), f"failed={[k for k, v in res.items() if not v]}")


def static_checks(repo, api):
    docs = " ".join(open(f, errors="replace").read().lower()
                    for f in glob.glob(os.path.join(repo, "apps/docs/docs/**/*.md"), recursive=True))
    need = ["capacity", "/availability", "approvedcount", "pendingcount", "seatsleft", "course_full"]
    missing = [w for w in need if w not in docs]
    api.rec("E-AC12", "docs describe capacity, the availability endpoint and COURSE_FULL",
            not missing, f"docs missing: {missing}")
