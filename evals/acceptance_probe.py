#!/usr/bin/env python3
"""Objectively score TS-A acceptance criteria A-AC1..A-AC12 against a built arm.

Why this exists: "Acceptance Criteria Passed / Total" is a scored SRD field,
and letting each operator eyeball it makes arms — and harnesses — not
comparable. This drives the real Azure Functions host over HTTP (the same
`func start --script-root deploy/` the acceptance suite uses) and checks the
criteria from outside the implementation, so it is equally valid against
Claude's output, Copilot's, or anyone else's.

It reads the SRD criteria; it does not read the implementation. A criterion
that cannot be checked over HTTP is reported as DELEGATED with the evidence
source named, never silently counted as a pass.

Usage:
  python3 evals/acceptance_probe.py --repo /path/to/arm [--port 7971] \
      [--out evals/phase2/acceptance-<arm>.json] [--skip-build]
"""
import argparse
import json
import os
import re
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def http(base, path, timeout=20):
    url = f"{base}{path}"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(body or "null")
        except Exception:
            return e.code, {"_raw": body[:400]}
    except Exception as e:
        return None, {"_error": str(e)[:200]}


def ci_contains(course, needle):
    n = needle.lower()
    if n in (course.get("title") or "").lower():
        return True
    if n in (course.get("summary") or "").lower():
        return True
    return any(n in str(t).lower() for t in (course.get("tags") or []))


def run_checks(base):
    R = []

    def rec(cid, desc, ok, detail=""):
        R.append({"id": cid, "criterion": desc,
                  "result": "PASS" if ok else "FAIL", "detail": detail})
        return ok

    st, d = http(base, "/api/courses")
    body = d if isinstance(d, dict) else {}
    items = body.get("items")
    rec("A-AC1", "default pagination returns a paginated list",
        st == 200 and isinstance(items, list)
        and body.get("page") == 1 and body.get("pageSize") == 10
        and isinstance(body.get("totalItems"), int)
        and isinstance(body.get("totalPages"), int),
        f"status={st} page={body.get('page')} pageSize={body.get('pageSize')} "
        f"totalItems={body.get('totalItems')} items={len(items) if isinstance(items, list) else 'n/a'}")

    st, d = http(base, "/api/courses?q=security&pageSize=50")
    got = (d or {}).get("items") or []
    rec("A-AC2", "q matches title, summary or tags, case-insensitively",
        st == 200 and len(got) > 0 and all(ci_contains(c, "security") for c in got),
        f"status={st} matched={len(got)}")

    st, d = http(base, "/api/courses?modality=online&pageSize=50")
    got = (d or {}).get("items") or []
    rec("A-AC3", "modality filter returns only that modality",
        st == 200 and len(got) > 0 and all(c.get("modality") == "online" for c in got),
        f"status={st} n={len(got)} modalities={sorted({c.get('modality') for c in got})}")

    st, d = http(base, "/api/courses?status=active&pageSize=50")
    got = (d or {}).get("items") or []
    rec("A-AC4", "status filter returns only that status",
        st == 200 and len(got) > 0 and all(c.get("status") == "active" for c in got),
        f"status={st} n={len(got)} statuses={sorted({c.get('status') for c in got})}")

    st, d = http(base, "/api/courses?tag=ai&pageSize=50")
    got = (d or {}).get("items") or []
    rec("A-AC5", "tag filter matches case-insensitively",
        st == 200 and len(got) > 0
        and all(any("ai" == str(t).lower() for t in (c.get("tags") or [])) for c in got),
        f"status={st} n={len(got)}")

    st, d = http(base, "/api/courses?page=1&pageSize=5")
    body = d if isinstance(d, dict) else {}
    got = body.get("items") or []
    rec("A-AC6", "pageSize caps the page and metadata is present",
        st == 200 and len(got) <= 5 and body.get("pageSize") == 5
        and isinstance(body.get("totalPages"), int),
        f"status={st} returned={len(got)} pageSize={body.get('pageSize')}")

    st, d = http(base, "/api/courses?sort=createdAt&pageSize=50")
    got = (d or {}).get("items") or []
    dates = [c.get("createdAt") for c in got]
    rec("A-AC7", "sort=createdAt returns records ordered by createdAt",
        st == 200 and len(got) > 1 and dates == sorted(dates),
        f"status={st} n={len(got)} ordered={dates == sorted(dates)}")

    bad = {
        "modality": "/api/courses?modality=nope",
        "status": "/api/courses?status=nope",
        "page": "/api/courses?page=0",
        "pageSize": "/api/courses?pageSize=99",
        "sort": "/api/courses?sort=nope",
    }
    codes = {}
    shapes = 0
    for field, path in bad.items():
        st, d = http(base, path)
        codes[field] = st
        err = (d or {}).get("error") or {}
        if isinstance(err, dict) and err.get("code") and err.get("message"):
            shapes += 1
    # The criterion is "HTTP 400 with a consistent error response" — a bare
    # 400 with no {code,message} body does not satisfy it, so the envelope
    # count gates the result instead of being decoration in the detail string.
    rec("A-AC8", "invalid modality/status/page/pageSize/sort each return 400 "
                 "with a consistent error envelope",
        all(c == 400 for c in codes.values()) and shapes == len(bad),
        f"codes={codes} consistent_error_envelope={shapes}/{len(bad)}")

    st, d = http(base, "/api/courses?q=zzzzz-no-such-course-zzzzz")
    body = d if isinstance(d, dict) else {}
    rec("A-AC9", "no matches returns 200 with an empty list, not an error",
        st == 200 and body.get("items") == [] and isinstance(body.get("totalItems"), int),
        f"status={st} items={body.get('items')} totalItems={body.get('totalItems')}")

    return R


def seed_check(base):
    """Task A requirement (Seed Data section), inherited by Task B through B1: seed or
    fixture data has at least 12 courses with a mix of modalities, statuses and tags.
    Not an acceptance criterion, so reported on its own `SEED:` line, never in X/Y.
    Courses are listed per status, since a default list may show only active ones."""
    courses = {}
    for status in ("draft", "active", "retired"):
        page, pages = 1, 1
        while page <= min(pages, 20):
            st, d = http(base, f"/api/courses?status={status}&pageSize=50&page={page}")
            if st != 200 or not isinstance(d, dict):
                break
            for c in d.get("items") or []:
                if isinstance(c, dict):
                    courses[c.get("id")] = c
            pages = d.get("totalPages") or 1
            page += 1
    mods = {c.get("modality") for c in courses.values()}
    stats = {c.get("status") for c in courses.values()}
    tags = {str(t).lower() for c in courses.values() for t in (c.get("tags") or [])}
    ok = len(courses) >= 12 and len(mods) >= 2 and len(stats) >= 2 and len(tags) >= 2
    return ok, (f"{len(courses)} courses; modalities {len(mods)}, statuses {len(stats)}, "
                f"tags {len(tags)} (need >= 12 courses and a mix of each)")


def static_checks(repo):
    """Criteria that are not observable over HTTP. Reported, never assumed."""
    R = []

    R.append({
        "id": "A-AC10", "criterion": "existing tests still pass",
        "result": "DELEGATED",
        "detail": "Evidence source: `corepack pnpm run verify` output for this arm.",
    })

    # The axc scaffold keeps features under src/features; an older scaffold used
    # features/. Check both so A-AC11 is counted, not silently zero.
    feat = next((d for d in (os.path.join(repo, "packages/axc-verification/acceptance-api/src/features"),
                             os.path.join(repo, "packages/axc-verification/acceptance-api/features"))
                 if os.path.isdir(d)), os.path.join(repo, "packages/axc-verification/acceptance-api/src/features"))
    scen = 0
    if os.path.isdir(feat):
        for f in os.listdir(feat):
            if f.endswith(".feature"):
                try:
                    txt = open(os.path.join(feat, f), errors="replace").read()
                    scen += len(re.findall(r"^\s*(Scenario|Example)\b", txt, re.M))
                    scen += len(re.findall(r"^\s*Scenario Outline\b", txt, re.M))
                except Exception:
                    pass
    unit = 0
    for root, _d, files in os.walk(os.path.join(repo, "packages")):
        if "node_modules" in root:
            continue
        for f in files:
            if "course" in f.lower() and f.endswith((".test.ts", ".spec.ts")):
                unit += 1
    R.append({
        "id": "A-AC11",
        "criterion": "new tests cover success, filters, pagination, sorting, validation",
        "result": "COUNTED",
        "detail": f"{scen} acceptance scenario(s) in features/, "
                  f"{unit} course-named unit/integration test file(s). "
                  f"Coverage adequacy is a reviewer judgement; this is the count only.",
    })

    # Search rather than assume a path: repos lay their docs site out
    # differently (this scaffold uses apps/docs/docs/courses.md, an earlier one
    # used apps/docs/docs/api/courses.md), and a hardcoded path made the probe
    # report a FAIL for documentation that existed.
    # Content-based: agents legitimately name the page by capability
    # (course-search.md, course-catalog-search.md, ...). Pick the doc that
    # mentions the endpoint, whatever it is called.
    doc = None
    import glob as _glob
    for h in sorted(_glob.glob(os.path.join(repo, "apps/docs/**/*.md"), recursive=True)):
        if "node_modules" in h:
            continue
        try:
            if "/api/courses" in open(h, errors="replace").read().lower():
                doc = h
                break
        except Exception:
            continue
    if doc:
        txt = open(doc, errors="replace").read().lower()
        have = {
            "endpoint path": "/api/courses" in txt,
            "query parameters": all(k in txt for k in ("q", "modality", "status", "tag", "page", "pagesize", "sort")),
            "success response": "items" in txt and "totalitems" in txt,
            "error response": "invalid_query_parameter" in txt or ("400" in txt and "error" in txt),
        }
        R.append({
            "id": "A-AC12", "criterion": "docs cover path, params, success and error responses",
            "result": "PASS" if all(have.values()) else "FAIL",
            "detail": f"{os.path.relpath(doc, repo)}: " +
                      ", ".join(f"{k}={'y' if v else 'n'}" for k, v in have.items()),
        })
    else:
        R.append({"id": "A-AC12", "criterion": "docs cover path, params, success and error responses",
                  "result": "FAIL", "detail": "no apps/docs/docs/api/courses.md found"})
    return R


def wait_ready(base, proc, timeout=180):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            return False
        st, _ = http(base, "/health", timeout=3)
        if st == 200:
            return True
        time.sleep(2)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--port", type=int, default=7971)
    ap.add_argument("--out")
    ap.add_argument("--skip-build", action="store_true")
    args = ap.parse_args()

    repo = os.path.abspath(args.repo)
    base = f"http://127.0.0.1:{args.port}"
    # Match apps/api/scripts/start-host.ts exactly: local.settings.json is
    # gitignored and generated at runtime there, so the host gets the same
    # values through the environment here. Without EnableWorkerIndexing the
    # v4 node model registers no functions and /health never comes up.
    env = dict(os.environ,
               AXC_ENVIRONMENT="test", FUNCTIONS_WORKER_RUNTIME="node",
               AzureWebJobsFeatureFlags="EnableWorkerIndexing",
               AzureWebJobsStorage="")

    if not args.skip_build:
        print("building arm ...", flush=True)
        b = subprocess.run("corepack pnpm run build", shell=True, cwd=repo,
                           capture_output=True, text=True, env=env, timeout=1800)
        if b.returncode != 0:
            print("BUILD FAILED\n" + (b.stdout or "")[-1500:] + (b.stderr or "")[-1500:])
            return 2

    api = os.path.join(repo, "apps/api")
    print(f"starting host on :{args.port} ...", flush=True)
    proc = subprocess.Popen(
        ["func", "start", "--script-root", "deploy/", "--port", str(args.port)],
        cwd=api, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        start_new_session=True)
    try:
        if not wait_ready(base, proc):
            print("host never became ready")
            return 3
        print("host ready; probing\n", flush=True)
        results = run_checks(base) + static_checks(repo)
        seed_ok, seed_detail = seed_check(base)
    finally:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except Exception:
            pass

    scored = [r for r in results if r["result"] in ("PASS", "FAIL")]
    passed = sum(1 for r in scored if r["result"] == "PASS")
    out = {
        "repo": repo, "task_set": "TS-A-CATALOG-SEARCH",
        "acceptance_passed": passed, "acceptance_scored": len(scored),
        "acceptance_total_defined": 12,
        "note": ("Scored = criteria objectively checkable here. A-AC10 is "
                 "DELEGATED to the verify gate and A-AC11 is COUNTED, not "
                 "judged; neither is counted as a pass."),
        "seed": {"result": "PASS" if seed_ok else "FAIL", "detail": seed_detail},
           "results": results,
    }
    if args.out:
        os.makedirs(os.path.dirname(args.out), exist_ok=True)
        json.dump(out, open(args.out, "w"), indent=2)
        print(f"wrote {args.out}\n")

    for r in results:
        mark = {"PASS": "ok  ", "FAIL": "FAIL", "DELEGATED": "--  ",
                "COUNTED": "##  "}[r["result"]]
        print(f"  {mark} {r['id']:7s} {r['criterion']}")
        if r["result"] != "PASS":
            print(f"          {r['detail']}")
    print(f"\n  SEED: {'PASS' if seed_ok else 'FAIL'} ({seed_detail})")
    print(f"  acceptance: {passed}/{len(scored)} objectively checked "
          f"(of 12 defined; A-AC10 delegated, A-AC11 counted)")
    return 0 if passed == len(scored) else 1


if __name__ == "__main__":
    sys.exit(main())
