"""Task C grader: instructor directory. Seed data is fixed by the spec, so expected ids are exact."""
import glob, os

EP = "/api/instructors"
SEED = {
    "instructor-001": ("Priya Raman", "priya.raman@example.org", "security", "Principal Instructor", True),
    "instructor-002": ("Marcus Chen", "marcus.chen@example.org", "engineering", "Senior Instructor", True),
    "instructor-003": ("Elena Petrova", "elena.petrova@example.org", "data", "Instructor", True),
    "instructor-004": ("Samuel Okafor", "samuel.okafor@example.org", "engineering", "Instructor", False),
    "instructor-005": ("Hannah Brooks", "hannah.brooks@example.org", "design", "Senior Instructor", True),
    "instructor-006": ("Diego Alvarez", "diego.alvarez@example.org", "security", "Instructor", True),
    "instructor-007": ("Mei Tanaka", "mei.tanaka@example.org", "data", "Principal Instructor", False),
    "instructor-008": ("Liam Walsh", "liam.walsh@example.org", "engineering", "Instructor", True),
    "instructor-009": ("Fatima Haddad", "fatima.haddad@example.org", "data", "Senior Instructor", True),
    "instructor-010": ("Noah Fischer", "noah.fischer@example.org", "design", "Instructor", False),
}
BY_NAME = sorted(SEED, key=lambda i: SEED[i][0].lower())


def record(iid):
    n, e, d, t, a = SEED[iid]
    return {"id": iid, "name": n, "email": e, "department": d, "title": t, "active": a}


def expect(pred):
    return [i for i in BY_NAME if pred(SEED[i])]


def ids(body):
    items = body.get("items") if isinstance(body, dict) else None
    return [x.get("id") for x in items] if isinstance(items, list) else None


def run_checks(api):
    st, b = api.get(EP)
    b = b if isinstance(b, dict) else {}
    meta = (b.get("page"), b.get("pageSize"), b.get("totalItems"), b.get("totalPages"))
    api.rec("C-AC1", "default list returns all 10 instructors ordered by name with default pagination",
            st == 200 and ids(b) == BY_NAME and meta == (1, 10, 10, 1),
            f"status={st} ids={ids(b)} meta={meta}")

    want = expect(lambda r: "an" in r[0].lower())
    st, b = api.get(f"{EP}?q=AN&pageSize=50")
    api.rec("C-AC2", "q matches name case-insensitively", st == 200 and ids(b) == want,
            f"status={st} got={ids(b)} want={want}")

    want = expect(lambda r: r[2] == "data")
    st, b = api.get(f"{EP}?department=data&pageSize=50")
    api.rec("C-AC3", "department filter returns only that department", st == 200 and ids(b) == want,
            f"status={st} got={ids(b)} want={want}")

    wf, wt = expect(lambda r: not r[4]), expect(lambda r: r[4])
    st1, b1 = api.get(f"{EP}?active=false&pageSize=50")
    st2, b2 = api.get(f"{EP}?active=true&pageSize=50")
    api.rec("C-AC4", "active filter returns only matching instructors",
            st1 == 200 and ids(b1) == wf and st2 == 200 and ids(b2) == wt,
            f"false={st1}/{ids(b1)} true={st2}/{ids(b2)}")

    want = expect(lambda r: r[2] == "engineering" and r[4])
    st, b = api.get(f"{EP}?department=engineering&active=true&pageSize=50")
    api.rec("C-AC5", "department and active filters combine", st == 200 and ids(b) == want,
            f"status={st} got={ids(b)} want={want}")

    st1, b1 = api.get(f"{EP}?page=2&pageSize=4")
    b1 = b1 if isinstance(b1, dict) else {}
    m1 = (b1.get("page"), b1.get("pageSize"), b1.get("totalItems"), b1.get("totalPages"))
    st2, b2 = api.get(f"{EP}?page=4&pageSize=4")
    b2 = b2 if isinstance(b2, dict) else {}
    api.rec("C-AC6", "page/pageSize slice the name-ordered list; past the last page is empty",
            st1 == 200 and ids(b1) == BY_NAME[4:8] and m1 == (2, 4, 10, 3)
            and st2 == 200 and b2.get("items") == [] and b2.get("totalItems") == 10,
            f"p2={st1}/{ids(b1)} meta={m1} p4={st2}/{b2.get('items')}")

    st, b = api.get(f"{EP}?q=zzzz-no-such-instructor")
    b = b if isinstance(b, dict) else {}
    api.rec("C-AC7", "no matches returns 200 with an empty list",
            st == 200 and b.get("items") == [] and b.get("totalItems") == 0,
            f"status={st} items={b.get('items')} totalItems={b.get('totalItems')}")

    bad = {"department": "department=nope", "active": "active=yes", "page": "page=0",
           "pageSize": "pageSize=51"}
    extra = {"page": "page=abc", "pageSize": "pageSize=0"}
    res = {}
    for field, qs in list(bad.items()) + [(f + "#2", q) for f, q in extra.items()]:
        st, b = api.get(f"{EP}?{qs}")
        fld = field.split("#")[0]
        det = ((b or {}).get("error") or {}).get("details") if isinstance(b, dict) else None
        named = isinstance(det, list) and any(isinstance(d, dict) and d.get("field") == fld for d in det)
        res[qs] = st == 400 and api.err_code(b) == "INVALID_QUERY_PARAMETER" and named
    api.rec("C-AC8", "invalid department/active/page/pageSize return 400 INVALID_QUERY_PARAMETER naming the field",
            all(res.values()), f"failed={[k for k, v in res.items() if not v]}")

    st, b = api.get(f"{EP}/instructor-003")
    want = record("instructor-003")
    api.rec("C-AC9", "GET by id returns the seeded record",
            st == 200 and isinstance(b, dict) and all(b.get(k) == v for k, v in want.items()),
            f"status={st} body={b}")

    st, b = api.get(f"{EP}/instructor-999")
    api.rec("C-AC10", "unknown id returns 404 INSTRUCTOR_NOT_FOUND",
            st == 404 and api.err_code(b) == "INSTRUCTOR_NOT_FOUND", f"status={st} code={api.err_code(b)}")


def static_checks(repo, api):
    docs = " ".join(open(f, errors="replace").read().lower()
                    for f in glob.glob(os.path.join(repo, "apps/docs/docs/**/*.md"), recursive=True))
    need = ["/api/instructors", "department", "active", "pagesize", "totalitems",
            "invalid_query_parameter", "instructor_not_found"]
    missing = [w for w in need if w not in docs]
    api.rec("C-AC13", "docs cover both paths, query parameters, success and error responses",
            not missing, f"docs missing: {missing}")
