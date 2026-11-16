"""Task J grader: learner profiles with optimistic concurrency (version-guarded PUT)."""
import glob, os

EP = "/api/learners"
EDIT = ("email", "displayName", "bio", "version")


def fields(body):
    det = ((body or {}).get("error") or {}).get("details") if isinstance(body, dict) else None
    return {d.get("field") for d in det if isinstance(d, dict)} if isinstance(det, list) else set()


def run_checks(api):
    def snap(lid):
        st, b = api.get(f"{EP}/{lid}")
        return {k: b.get(k) for k in EDIT + ("updatedAt",)} if st == 200 and isinstance(b, dict) else None

    st, a = api.post(EP, {"email": "Jordan.Lee@Example.org", "displayName": "  Jordan Lee  "})
    a = a if isinstance(a, dict) else {}
    lid = a.get("id")
    api.rec("J-AC1", "valid POST returns 201 at version 1 with normalized email/displayName and empty bio",
            st == 201 and bool(lid) and a.get("email") == "jordan.lee@example.org"
            and a.get("displayName") == "Jordan Lee" and a.get("bio") == "" and a.get("version") == 1
            and isinstance(a.get("createdAt"), str) and isinstance(a.get("updatedAt"), str),
            f"status={st} body={a}")

    st, g = api.get(f"{EP}/{lid}") if lid else (None, {})
    api.rec("J-AC2", "GET by id returns the stored profile",
            st == 200 and isinstance(g, dict) and all(g.get(k) == a.get(k) for k in ("id", "email", "displayName", "bio", "version", "createdAt")),
            f"status={st} body={g}")

    st1, b1 = api.get(f"{EP}/learner-does-not-exist")
    st2, b2 = api.put(f"{EP}/learner-does-not-exist", {"email": "ghost@example.org", "displayName": "Ghost", "version": 1})
    api.rec("J-AC3", "GET and PUT on unknown id return 404 LEARNER_NOT_FOUND",
            st1 == 404 and api.err_code(b1) == "LEARNER_NOT_FOUND" and st2 == 404 and api.err_code(b2) == "LEARNER_NOT_FOUND",
            f"get={st1}/{api.err_code(b1)} put={st2}/{api.err_code(b2)}")

    cases = {"email": {"email": "not-an-email", "displayName": "Valid Name"},
             "email#2": {"email": "a b@example.org", "displayName": "Valid Name"},
             "email#3": {"email": "user@localhost", "displayName": "Valid Name"},
             "displayName": {"email": "dn1@example.org", "displayName": " X "},
             "displayName#2": {"email": "dn61@example.org", "displayName": "x" * 61},
             "bio": {"email": "bio@example.org", "displayName": "Valid Name", "bio": "x" * 281}}
    res = {}
    for k, body in cases.items():
        st, b = api.post(EP, body)
        res[k] = (st, api.err_code(b), k.split("#")[0] in fields(b))
    api.rec("J-AC4", "invalid email/displayName/bio return 400 INVALID_REQUEST naming the field",
            all(v == (400, "INVALID_REQUEST", True) for v in res.values()), res)

    st, b = api.post(EP, {"email": "JORDAN.LEE@example.ORG", "displayName": "Someone Else"})
    api.rec("J-AC5", "duplicate email on create (any case) returns 409 DUPLICATE_LEARNER_EMAIL",
            st == 409 and api.err_code(b) == "DUPLICATE_LEARNER_EMAIL", f"status={st} code={api.err_code(b)}")

    if not lid:
        for cid in ("J-AC6", "J-AC7", "J-AC8", "J-AC9", "J-AC10", "J-AC11"):
            api.rec(cid, "PUT behaviour", False, "no learner created")
        return

    st, u = api.put(f"{EP}/{lid}", {"email": "jordan.lee@example.org", "displayName": "Jordan A. Lee",
                                    "bio": "Platform engineer and course mentor.", "version": 1})
    u = u if isinstance(u, dict) else {}
    api.rec("J-AC6", "PUT with current version replaces fields, increments version, keeps id/createdAt",
            st == 200 and u.get("version") == 2 and u.get("displayName") == "Jordan A. Lee"
            and u.get("bio") == "Platform engineer and course mentor." and u.get("id") == lid
            and u.get("createdAt") == a.get("createdAt"),
            f"status={st} body={u}")

    seen = [u.get("version")]
    for n, ver in ((3, 2), (4, 3)):
        st, b = api.put(f"{EP}/{lid}", {"email": "jordan.lee@example.org", "displayName": f"Jordan Lee {n}", "version": ver})
        seen.append((b or {}).get("version") if st == 200 else f"{st}")
    cur = snap(lid) or {}
    api.rec("J-AC7", "each update increments version by 1 and GET shows the latest",
            seen == [2, 3, 4] and cur.get("version") == 4 and cur.get("displayName") == "Jordan Lee 4" and cur.get("bio") == "",
            f"versions={seen} get={cur}")

    before = snap(lid)
    st1, b1 = api.put(f"{EP}/{lid}", {"email": "jordan.lee@example.org", "displayName": "Stale Writer", "version": 2})
    st2, b2 = api.put(f"{EP}/{lid}", {"email": "jordan.lee@example.org", "displayName": "Future Writer", "version": 9})
    after = snap(lid)
    api.rec("J-AC8", "older/newer version returns 409 VERSION_CONFLICT and the profile is unchanged",
            st1 == 409 and api.err_code(b1) == "VERSION_CONFLICT" and st2 == 409 and api.err_code(b2) == "VERSION_CONFLICT"
            and before is not None and after == before,
            f"old={st1}/{api.err_code(b1)} new={st2}/{api.err_code(b2)} unchanged={after == before}")

    before = snap(lid)
    res = {}
    for k, ver in (("missing", None), ("string", "4"), ("fraction", 4.5), ("zero", 0)):
        body = {"email": "jordan.lee@example.org", "displayName": "Version Probe"}
        if ver is not None:
            body["version"] = ver
        st, b = api.put(f"{EP}/{lid}", body)
        res[k] = (st, api.err_code(b), "version" in fields(b))
    after = snap(lid)
    api.rec("J-AC9", "PUT without/with invalid version returns 400 naming version, nothing changes",
            all(v == (400, "INVALID_REQUEST", True) for v in res.values()) and before is not None and after == before,
            f"{res} unchanged={after == before}")

    before = snap(lid)
    res = {}
    for k, body in (("email", {"email": "bad", "displayName": "Jordan Lee", "version": 4}),
                    ("displayName", {"email": "jordan.lee@example.org", "displayName": "J", "version": 4}),
                    ("bio", {"email": "jordan.lee@example.org", "displayName": "Jordan Lee", "bio": "x" * 281, "version": 4})):
        st, b = api.put(f"{EP}/{lid}", body)
        res[k] = (st, api.err_code(b), k in fields(b))
    after = snap(lid)
    api.rec("J-AC10", "PUT breaking a field rule returns 400, nothing changes",
            all(v == (400, "INVALID_REQUEST", True) for v in res.values()) and before is not None and after == before,
            f"{res} unchanged={after == before}")

    st0, other = api.post(EP, {"email": "sam.rivera@example.org", "displayName": "Sam Rivera"})
    before = snap(lid)
    st, b = api.put(f"{EP}/{lid}", {"email": "Sam.Rivera@example.org", "displayName": "Jordan Lee", "version": 4})
    after = snap(lid)
    api.rec("J-AC11", "PUT to another learner's email returns 409 DUPLICATE_LEARNER_EMAIL, nothing changes",
            st0 == 201 and st == 409 and api.err_code(b) == "DUPLICATE_LEARNER_EMAIL" and before is not None and after == before,
            f"other={st0} put={st}/{api.err_code(b)} unchanged={after == before}")


def static_checks(repo, api):
    docs = " ".join(open(f, errors="replace").read().lower()
                    for f in glob.glob(os.path.join(repo, "apps/docs/docs/**/*.md"), recursive=True))
    need = ["/api/learners", "put", "version", "version_conflict", "learner_not_found",
            "duplicate_learner_email", "invalid_request"]
    missing = [w for w in need if w not in docs]
    api.rec("J-AC14", "docs describe endpoints, bodies, the version rule and error cases",
            not missing, f"docs missing: {missing}")
