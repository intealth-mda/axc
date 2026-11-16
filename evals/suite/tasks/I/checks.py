"""Task I (extend): course search sort direction via a '-' prefix."""
import glob, os

ORDER = {
    "title": ["course-001", "course-005", "course-002", "course-003", "course-004", "course-006"],
    "createdAt": ["course-004", "course-003", "course-006", "course-001", "course-002", "course-005"],
    "updatedAt": ["course-004", "course-006", "course-003", "course-005", "course-002", "course-001"],
}
INVALID = ["unknown", "id", "-unknown", "-id", "-", "--title", "-Title"]


def ids(api, query):
    st, b = api.get(f"/api/courses?{query}")
    items = b.get("items") if isinstance(b, dict) else None
    return st, ([i.get("id") for i in items] if isinstance(items, list) else None), b


def run_checks(api):
    for n, field in (("I-AC1", "createdAt"), ("I-AC2", "updatedAt"), ("I-AC3", "title")):
        st, got, _ = ids(api, f"sort=-{field}")
        want = ORDER[field][::-1]
        api.rec(n, f"sort=-{field} returns descending {field} order", st == 200 and got == want, f"{st} {got}")

    res = {q: ids(api, q)[:2] for q in ("", "sort=title", "sort=createdAt", "sort=updatedAt")}
    want = {"": ORDER["title"], "sort=title": ORDER["title"],
            "sort=createdAt": ORDER["createdAt"], "sort=updatedAt": ORDER["updatedAt"]}
    api.rec("I-AC4", "ascending sorts and the default sort are unchanged",
            all(res[q] == (200, want[q]) for q in want), {q: r for q, r in res.items() if r != (200, want[q])})

    st, got, b = ids(api, "status=active&sort=-createdAt&page=2&pageSize=2")
    meta = (b.get("totalItems"), b.get("totalPages")) if isinstance(b, dict) else None
    api.rec("I-AC5", "descending sort applies before pagination and with filters",
            st == 200 and got == ["course-001", "course-006"] and meta == (4, 2), f"{st} {got} meta={meta}")

    bad = {}
    for v in INVALID:
        st, b = api.get(f"/api/courses?sort={v}")
        fields = [d.get("field") for d in ((b or {}).get("error") or {}).get("details") or []] if isinstance(b, dict) else []
        if not (st == 400 and api.err_code(b) == "INVALID_QUERY_PARAMETER" and "sort" in fields):
            bad[v] = (st, api.err_code(b), fields)
    api.rec("I-AC6", "invalid sort values return 400 INVALID_QUERY_PARAMETER for field sort", not bad, bad)


def static_checks(repo, api):
    docs = "".join(open(p, encoding="utf-8").read() for ext in ("md", "mdx")
                   for p in glob.glob(os.path.join(repo, f"apps/docs/docs/**/*.{ext}"), recursive=True))
    api.rec("I-AC7", "docs describe the descending prefix with the example sort=-createdAt",
            "sort=-createdAt" in docs, "no apps/docs/docs/**/*.md(x) contains sort=-createdAt")
