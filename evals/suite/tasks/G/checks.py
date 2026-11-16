"""Task G (security): mask learnerEmail in enrollment request list results."""
import glob, os, re

EP = "/api/enrollment-requests"
J = "I need this course to prepare for upcoming secure development work."
E1, E2 = "probe.learner@example.org", "z@Mask-Probe.Example.ORG"
MASKED = re.compile(r"^[^@]\*\*\*@[^@]+$")


def items(api, query=""):
    st, b = api.get(EP + query)
    its = b.get("items") if isinstance(b, dict) else None
    return st, its if isinstance(its, list) else []


def by_id(its, rid):
    return next((i for i in its if i.get("id") == rid), None)


def run_checks(api):
    s1, r1 = api.post(EP, {"courseId": "course-001", "learnerEmail": E1, "justification": J})
    s2, r2 = api.post(EP, {"courseId": "course-002", "learnerEmail": E2, "justification": J})
    id1, id2 = (r1 or {}).get("id"), (r2 or {}).get("id")
    if s1 != 201 or s2 != 201 or not id1 or not id2:
        api.rec("G-AC1", "unfiltered list masks every learnerEmail", False, f"setup create failed: {s1} {s2}")
        return

    st, all_items = items(api)
    i1 = by_id(all_items, id1)
    api.rec("G-AC1", "unfiltered list masks every learnerEmail",
            st == 200 and all_items and all(MASKED.match(str(i.get("learnerEmail"))) for i in all_items)
            and i1 is not None and i1.get("learnerEmail") == "p***@example.org",
            f"status={st} emails={[i.get('learnerEmail') for i in all_items][:5]}")

    det, ok = [], True
    for q in ("?status=pending", "?courseId=course-001"):
        st, its = items(api, q)
        hit = by_id(its, id1)
        good = st == 200 and hit is not None and hit.get("learnerEmail") == "p***@example.org" \
            and all(MASKED.match(str(i.get("learnerEmail"))) for i in its)
        ok &= good
        det.append(f"{q}:{st}:{(hit or {}).get('learnerEmail')}")
    api.rec("G-AC2", "status- and courseId-filtered lists are masked", ok, " ".join(det))

    i2 = by_id(all_items, id2)
    api.rec("G-AC3", "mask keeps first character and domain (one-char local part, mixed-case domain)",
            i2 is not None and i2.get("learnerEmail") == "z***@Mask-Probe.Example.ORG",
            f"got {(i2 or {}).get('learnerEmail')}")

    det, ok = [], True
    for q in (f"?learnerEmail={E1}", f"?learnerEmail={E1.upper()}", f"?learnerEmail={E1}&status=pending"):
        st, its = items(api, q)
        ok &= st == 200 and [i.get("id") for i in its] == [id1] and its[0].get("learnerEmail") == E1
        det.append(f"{q}:{st}:{[i.get('learnerEmail') for i in its]}")
    api.rec("G-AC4", "learnerEmail filter returns full addresses, case-insensitively", ok, " ".join(det))

    sg, g1 = api.get(f"{EP}/{id1}")
    sp, p2 = api.patch(f"{EP}/{id2}/status", {"status": "approved", "changedBy": "reviewer@example.org"})
    api.rec("G-AC5", "create, get by id and status change keep the full learnerEmail",
            r1.get("learnerEmail") == E1 and r2.get("learnerEmail") == E2
            and sg == 200 and (g1 or {}).get("learnerEmail") == E1
            and sp == 200 and (p2 or {}).get("learnerEmail") == E2,
            f"post={r1.get('learnerEmail')} get={sg}:{(g1 or {}).get('learnerEmail')} patch={sp}:{(p2 or {}).get('learnerEmail')}")

    strip = lambda d: {k: v for k, v in (d or {}).items() if k != "learnerEmail"}
    api.rec("G-AC6", "apart from learnerEmail, a list item equals the get-by-id response",
            i1 is not None and sg == 200 and strip(i1) == strip(g1), f"list={strip(i1)} get={strip(g1)}"[:300])

    sa, appr = items(api, "?status=approved")
    sc, c2 = items(api, "?courseId=course-002")
    sb, bad = api.get(f"{EP}?status=bogus")
    sd, dup = api.post(EP, {"courseId": "course-001", "learnerEmail": E1, "justification": J})
    api.rec("G-AC7", "filters, validation and duplicate prevention unchanged",
            sa == 200 and id2 in [i.get("id") for i in appr] and all(i.get("status") == "approved" for i in appr)
            and sc == 200 and id2 in [i.get("id") for i in c2] and all(i.get("courseId") == "course-002" for i in c2)
            and sb == 400 and api.err_code(bad) == "INVALID_REQUEST"
            and sd == 409 and api.err_code(dup) == "DUPLICATE_ACTIVE_REQUEST",
            f"approved={sa} course={sc} bogus={sb}/{api.err_code(bad)} dup={sd}/{api.err_code(dup)}")


def static_checks(repo, api):
    docs = "".join(open(p, encoding="utf-8").read() for ext in ("md", "mdx")
                   for p in glob.glob(os.path.join(repo, f"apps/docs/docs/**/*.{ext}"), recursive=True))
    api.rec("G-AC8", "docs describe the masking rule with the example l***@example.org",
            "l***@example.org" in docs, "no apps/docs/docs/**/*.md(x) contains l***@example.org")
