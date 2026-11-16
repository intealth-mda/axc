# Task Set H — Documentation Task Requirements

Fixed specification for Task Set H. The Task Set H prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-H-ERROR-CODE-REFERENCE |
| Task Name | API Error Code Reference |
| Purpose | Test whether the harness can produce accurate reference documentation from an existing codebase, verified against the source, and keep the documentation build green. |
| Expected Difficulty | Maintenance |
| Expected Scope | 1 new documentation page, sidebar registration, no API behavior change |
| Primary Rubric Categories Exercised | Documentation Quality, Architecture and Codebase Alignment, Security and Guardrail Compliance, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

The sample application exposes course search and enrollment request endpoints. Each endpoint documents its own errors, but API consumers have no single page that lists every error code, the HTTP status that carries it, and where it can occur. Client developers need that reference to map errors to user-facing messages.

The page must reflect what the application actually returns. It must be derived from the application source and must not describe behavior the API does not have.

## Allowed write boundary

The harness may create or modify files only in these locations:

| Path | Purpose |
| --- | --- |
| `apps/api/**` | REST routing / functional wiring |
| `packages/axc/rest/**` | Hono logic |
| `packages/axc/application-services/**` | Application services |
| `packages/axc/domain/**` | DDD domain logic |
| `packages/axc/persistence/**` | Data storage |
| `packages/axc/service-mongoose/**` | Data storage |
| `packages/axc/**` | Do not create any additional top-level directories beyond what already exist |
| `packages/axc-verification/**` | Unit, integration, architectural, and acceptance tests |
| `apps/docs/**` | MADR / API documentation |

This task needs documentation changes only. Source changes are out of scope.

## Do not modify

The harness must not modify:

| Area | Rule |
| --- | --- |
| API behavior | Do not change error codes, HTTP statuses, messages, or endpoints |
| Production configuration | No production settings, secrets, deployment, or environment changes |
| Authentication | Do not add or alter authentication |
| Existing documentation pages | Keep the existing pages and their sidebar entries |
| External integrations | No calls to external systems |
| Dependencies | Do not add dependencies |

## Error codes to document

The API returns exactly these error codes in the shared error body. The page must list all of them.

| Code |
| --- |
| `INVALID_QUERY_PARAMETER` |
| `INVALID_REQUEST` |
| `COURSE_NOT_FOUND` |
| `COURSE_NOT_ACTIVE` |
| `DUPLICATE_ACTIVE_REQUEST` |
| `ENROLLMENT_REQUEST_NOT_FOUND` |
| `INVALID_STATUS_TRANSITION` |

## Page requirements

| Field | Value |
| --- | --- |
| File | `apps/docs/docs/error-codes.md` |
| Title | First-level heading `Error codes` |
| Sidebar | Entry `error-codes` in `apps/docs/sidebars.ts`, added after the existing entries |
| Error body | One JSON example of the shared error body with `error.code`, `error.message`, and `error.details[]` of `{ field, message }` |
| Table columns | `Code`, `HTTP status`, `Meaning`, `Endpoints` |
| Table rows | One row per code. `HTTP status` is the numeric status (for example `404`). `Endpoints` names each endpoint that can return the code as method and path (for example `POST /api/enrollment-requests`). |

## Functional requirements

| ID | Requirement |
| --- | --- |
| H1 | Add `apps/docs/docs/error-codes.md` with the title `Error codes`. |
| H2 | Document the shared error body with a JSON example. |
| H3 | List every code from "Error codes to document" in one table, one row per code. |
| H4 | Give each code its HTTP status as returned by the API. |
| H5 | Give each code a meaning and the endpoints that can return it, derived from the application source. |
| H6 | Register the page in the sidebar after the existing entries, keeping the existing entries. |
| H7 | Do not change API behavior. |
| H8 | The documentation site build must still pass. |
| H9 | Existing tests must still pass. |

## API contract

### Shared error response format

All documented codes use this body:

```json
{
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "Course course-999 was not found.",
    "details": [
      {
        "field": "courseId",
        "message": "courseId must reference an existing course."
      }
    ]
  }
}
```

### Example table row

```markdown
| Code | HTTP status | Meaning | Endpoints |
| --- | --- | --- | --- |
| `COURSE_NOT_FOUND` | 404 | The referenced course does not exist. | `POST /api/enrollment-requests` |
```

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| H-AC1 | `apps/docs/docs/error-codes.md` exists with the first-level heading `Error codes`. |
| H-AC2 | Every listed error code appears in a table row together with the HTTP status the API returns for it. |
| H-AC3 | Every error code row names at least one endpoint as an `/api/…` path. |
| H-AC4 | The page includes a JSON example of the shared error body with `code`, `message`, and `details` (`field`, `message`). |
| H-AC5 | The sidebar registers `error-codes` and keeps `intro`, `healthcheck`, `courses`, and `enrollment-requests`. |
| H-AC6 | The documentation site build passes. |
| H-AC7 | The API still returns each documented code with its documented status. |
| H-AC8 | Existing tests still pass. |

## Required tests

No new tests are required. Existing tests must still pass, and the documentation build must pass.

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Documentation | `apps/docs/docs/error-codes.md` and the sidebar entry |
| Notes | Short summary of how each status, meaning, and endpoint was verified against the source |
| Validation output | Results from the documentation build, `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
