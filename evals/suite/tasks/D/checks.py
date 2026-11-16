"""Task D grader: learning resources library. The library starts empty (spec D model), so lists are exact."""
import glob, os

EP = "/api/resources"


def fields(body):
    det = ((body or {}).get("error") or {}).get("details") if isinstance(body, dict) else None
    return {d.get("field") for d in det if isinstance(d, dict)} if isinstance(det, list) else set()


def bad(api, body, field):
    st, b = api.post(EP, body)
    return st == 400 and api.err_code(b) == "INVALID_REQUEST" and field in fields(b), f"{st}/{api.err_code(b)}/{sorted(fields(b))}"


def run_checks(api):
    created = []  # ids in creation order

    def make(title, url, typ, tags=None):
        body = {"title": title, "url": url, "type": typ}
        if tags is not None:
            body["tags"] = tags
        st, b = api.post(EP, body)
        if st == 201 and isinstance(b, dict) and b.get("id"):
            created.append(b["id"])
        return st, b

    st, b = make("  Threat Modeling for Web APIs  ", "https://example.org/articles/threat-modeling", "article",
                 [" Security ", "API"])
    b = b if isinstance(b, dict) else {}
    first = b.get("id")
    api.rec("D-AC1", "valid POST returns 201 with id, createdAt, submitted fields and normalized tags",
            st == 201 and bool(first) and isinstance(b.get("createdAt"), str) and b.get("createdAt", "")[:2] == "20"
            and b.get("title") == "Threat Modeling for Web APIs"
            and b.get("url") == "https://example.org/articles/threat-modeling"
            and b.get("type") == "article" and b.get("tags") == ["security", "api"],
            f"status={st} body={b}")

    st, g = api.get(f"{EP}/{first}") if first else (None, {})
    api.rec("D-AC2", "GET by id returns the created resource",
            st == 200 and isinstance(g, dict) and all(g.get(k) == b.get(k) for k in ("id", "title", "url", "type", "tags", "createdAt")),
            f"status={st} body={g}")

    st, g = api.get(f"{EP}/res-does-not-exist")
    api.rec("D-AC3", "unknown id returns 404 RESOURCE_NOT_FOUND",
            st == 404 and api.err_code(g) == "RESOURCE_NOT_FOUND", f"status={st} code={api.err_code(g)}")

    U, T = "https://example.org/x", "Valid title"
    r = {"missing": bad(api, {"url": U, "type": "video"}, "title"),
         "short": bad(api, {"title": " ab ", "url": U, "type": "video"}, "title"),
         "long": bad(api, {"title": "x" * 121, "url": U, "type": "video"}, "title")}
    api.rec("D-AC4", "title missing/short/long returns 400 with a title detail",
            all(v[0] for v in r.values()), {k: v[1] for k, v in r.items()})

    r = {"http": bad(api, {"title": T, "url": "http://example.org/x", "type": "video"}, "url"),
         "ftp": bad(api, {"title": T, "url": "ftp://example.org/x", "type": "video"}, "url"),
         "relative": bad(api, {"title": T, "url": "example.org/x", "type": "video"}, "url"),
         "missing": bad(api, {"title": T, "type": "video"}, "url")}
    api.rec("D-AC5", "non-https, malformed or missing url returns 400 with a url detail",
            all(v[0] for v in r.values()), {k: v[1] for k, v in r.items()})

    r = {"unknown": bad(api, {"title": T, "url": U, "type": "podcast"}, "type"),
         "missing": bad(api, {"title": T, "url": U}, "type")}
    api.rec("D-AC6", "missing or unknown type returns 400 with a type detail",
            all(v[0] for v in r.values()), {k: v[1] for k, v in r.items()})

    r = {"six": bad(api, {"title": T, "url": U, "type": "tool", "tags": list("abcdef")}, "tags"),
         "not-array": bad(api, {"title": T, "url": U, "type": "tool", "tags": "ai"}, "tags"),
         "empty-tag": bad(api, {"title": T, "url": U, "type": "tool", "tags": ["  "]}, "tags"),
         "long-tag": bad(api, {"title": T, "url": U, "type": "tool", "tags": ["x" * 31]}, "tags")}
    st1, b1 = make("Intro to Prompting", "https://example.org/videos/prompting", "video")
    st2, b2 = make("Agent Tooling Course", "https://example.org/courses/agents", "course", ["ai", "agents", "Tools", "x", "y"])
    ok_ok = (st1 == 201 and (b1 or {}).get("tags") == [] and st2 == 201
             and (b2 or {}).get("tags") == ["ai", "agents", "tools", "x", "y"])
    api.rec("D-AC7", "tags rules: >5, non-array, bad length rejected; omitted -> [], exactly 5 accepted",
            all(v[0] for v in r.values()) and ok_ok,
            f"{ {k: v[1] for k, v in r.items()} } omitted={st1}/{(b1 or {}).get('tags')} five={st2}/{(b2 or {}).get('tags')}")

    st, b = api.post(EP, {"title": "x", "url": "http://example.org", "type": "podcast", "tags": list("abcdef")})
    got = fields(b)
    api.rec("D-AC8", "several invalid fields each get a details entry",
            st == 400 and api.err_code(b) == "INVALID_REQUEST" and {"title", "url", "type", "tags"} <= got,
            f"status={st} fields={sorted(got)}")

    make("Security Checklist Tool", "https://example.org/tools/checklist", "tool", ["security"])
    make("Securing Agents (video)", "https://example.org/videos/secure-agents", "video", ["SECURITY", "ai"])
    # expected state: ids by creation order with (type, tags)
    expect = {}
    for rid in created:
        _, rb = api.get(f"{EP}/{rid}")
        expect[rid] = ((rb or {}).get("type"), (rb or {}).get("tags") or [])

    def want(typ=None, tag=None):
        return [i for i in created if (typ is None or expect[i][0] == typ) and (tag is None or tag in expect[i][1])]

    def ids(path):
        st, b = api.get(path)
        items = (b or {}).get("items") if isinstance(b, dict) else None
        return st, [x.get("id") for x in items] if isinstance(items, list) else None

    cases = {"all": (EP, want()), "type": (f"{EP}?type=video", want("video")),
             "tag": (f"{EP}?tag=SeCuRiTy", want(tag="security")),
             "both": (f"{EP}?type=video&tag=security", want("video", "security"))}
    res = {k: ids(p) for k, (p, _) in cases.items()}
    api.rec("D-AC9", "list in creation order; type and tag filters alone and combined",
            len(created) == 5 and all(res[k] == (200, w) for k, (_, w) in cases.items()) and len(want("video", "security")) == 1,
            f"created={len(created)} got={res} want={ {k: w for k, (_, w) in cases.items()} }")

    st, b = api.get(f"{EP}?type=podcast")
    api.rec("D-AC10", "unknown type filter returns 400 INVALID_QUERY_PARAMETER",
            st == 400 and api.err_code(b) == "INVALID_QUERY_PARAMETER", f"status={st} code={api.err_code(b)}")

    st, b = api.post(EP, raw="{not json")
    st_l, ids_all = ids(EP)
    api.rec("D-AC11", "rejected requests store nothing; invalid JSON is a 400",
            st == 400 and api.err_code(b) == "INVALID_REQUEST" and st_l == 200 and ids_all == created and len(created) == 5,
            f"badjson={st}/{api.err_code(b)} listed={ids_all} created={created}")


def static_checks(repo, api):
    docs = " ".join(open(f, errors="replace").read().lower()
                    for f in glob.glob(os.path.join(repo, "apps/docs/docs/**/*.md"), recursive=True))
    need = ["/api/resources", "post", "https", "article", "tags", "invalid_request", "resource_not_found"]
    missing = [w for w in need if w not in docs]
    api.rec("D-AC14", "docs describe endpoints, body rules, responses and error cases",
            not missing, f"docs missing: {missing}")
