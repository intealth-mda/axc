"""Task H (docs): error code reference page, verified against the live API."""
import os, re, subprocess, tempfile

# Every code the seed API returns (packages/axc/rest/src/index.ts statusByCode), with its status.
STATUS = {
    "INVALID_QUERY_PARAMETER": 400,
    "INVALID_REQUEST": 400,
    "COURSE_NOT_FOUND": 404,
    "ENROLLMENT_REQUEST_NOT_FOUND": 404,
    "COURSE_NOT_ACTIVE": 409,
    "DUPLICATE_ACTIVE_REQUEST": 409,
    "INVALID_STATUS_TRANSITION": 409,
}
EP = "/api/enrollment-requests"
J = "I need this course to prepare for upcoming secure development work."


def run_checks(api):
    seen = {}
    seen["INVALID_QUERY_PARAMETER"] = api.get("/api/courses?pageSize=0")
    seen["INVALID_REQUEST"] = api.get(f"{EP}?status=bogus")
    seen["COURSE_NOT_FOUND"] = api.post(EP, {"courseId": "course-999", "learnerEmail": "h-probe@example.org", "justification": J})
    seen["COURSE_NOT_ACTIVE"] = api.post(EP, {"courseId": "course-003", "learnerEmail": "h-probe@example.org", "justification": J})
    _, created = api.post(EP, {"courseId": "course-001", "learnerEmail": "h-probe@example.org", "justification": J})
    seen["DUPLICATE_ACTIVE_REQUEST"] = api.post(EP, {"courseId": "course-001", "learnerEmail": "h-probe@example.org", "justification": J})
    seen["ENROLLMENT_REQUEST_NOT_FOUND"] = api.get(f"{EP}/no-such-request")
    seen["INVALID_STATUS_TRANSITION"] = api.patch(f"{EP}/{(created or {}).get('id')}/status",
                                                  {"status": "pending", "changedBy": "reviewer@example.org"})
    wrong = {c: (s, api.err_code(b)) for c, (s, b) in seen.items() if (s, api.err_code(b)) != (STATUS[c], c)}
    api.rec("H-AC7", "the API still returns each documented code with its documented status", not wrong, wrong)


def code_rows(text, code):
    pat = re.compile(rf"(?<![A-Z_]){code}(?![A-Z_])")
    return [l for l in text.splitlines() if l.lstrip().startswith("|") and pat.search(l)]


def static_checks(repo, api):
    page = os.path.join(repo, "apps/docs/docs/error-codes.md")
    text = open(page, encoding="utf-8").read() if os.path.isfile(page) else ""
    api.rec("H-AC1", "apps/docs/docs/error-codes.md exists with heading 'Error codes'",
            re.search(r"^#\s+Error codes\s*$", text, re.M | re.I) is not None
            or re.search(r"^title:\s*['\"]?Error codes", text, re.M | re.I) is not None,
            "missing page or heading")

    bad = [c for c, s in STATUS.items() if not any(re.search(rf"\b{s}\b", l) for l in code_rows(text, c))]
    api.rec("H-AC2", "every error code appears in a table row with its HTTP status", not bad, f"missing/wrong: {bad}")

    bad = [c for c in STATUS if not any("/api/" in l for l in code_rows(text, c))]
    api.rec("H-AC3", "every error code row names an /api/ endpoint", not bad, f"no endpoint: {bad}")

    blocks = re.findall(r"```json\s*\n(.*?)```", text, re.S)
    api.rec("H-AC4", "page shows the shared error body (code, message, details with field, message)",
            any(all(f'"{k}"' in b for k in ("error", "code", "message", "details", "field")) for b in blocks),
            "no json block with error/code/message/details/field")

    sb_path = os.path.join(repo, "apps/docs/sidebars.ts")
    sb = open(sb_path, encoding="utf-8").read() if os.path.isfile(sb_path) else ""
    need = ["error-codes", "intro", "healthcheck", "courses", "enrollment-requests"]
    missing = [n for n in need if not re.search(rf"['\"]{n}['\"]", sb)]
    api.rec("H-AC5", "sidebar registers error-codes and keeps the existing pages", not missing, f"missing: {missing}")

    with tempfile.TemporaryDirectory() as out:
        b = subprocess.run(["corepack", "pnpm", "exec", "docusaurus", "build", "--out-dir", out],
                           cwd=os.path.join(repo, "apps/docs"), capture_output=True, text=True, timeout=900)
    api.rec("H-AC6", "the documentation site build passes", b.returncode == 0,
            (b.stdout + b.stderr)[-300:])
