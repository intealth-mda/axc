# Task Set F — Bug Fix Task Requirements

Fixed specification for Task Set F. The Task Set F prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-F-TAG-FILTER-CASE |
| Task Name | Course Tag Filter Case Bug |
| Purpose | Test whether the harness can reproduce a reported defect, find its root cause in an existing codebase, fix it without collateral change, and guard it with a regression test. |
| Expected Difficulty | Maintenance |
| Expected Scope | 1 defect in existing course search, 1 regression test, no new endpoints |
| Primary Rubric Categories Exercised | Functional Correctness, Test and Validation Performance, Architecture and Codebase Alignment, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

The sample application already exposes `GET /api/courses` (course search) and the enrollment request endpoints. The courses documentation states that the `tag` filter is a case-insensitive exact match. A catalog user reports that filtering by a tag typed in capitals returns nothing, so learners who search for `AI` or `Security` see an empty catalog.

The fix must follow the existing project structure and coding conventions and must be testable without external services or production data.

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

## Do not modify

The harness must not modify:

| Area | Rule |
| --- | --- |
| Production configuration | No changes to `.env`, secrets, deployment config, cloud config, or production settings |
| Authentication | Do not add or alter authentication |
| Course seed data | Do not add, remove, or change courses in the seed |
| Response shape | Do not change the course search response fields or the error format |
| Unrelated domains | Do not change enrollment requests or other unrelated features |
| External integrations | Do not call external APIs or services |
| Dependencies | Do not add new dependencies unless clearly justified in implementation notes |

## Bug report

| Field | Value |
| --- | --- |
| Endpoint | `GET /api/courses` |
| Parameter | `tag` |
| Severity | Medium: catalog search returns empty results for valid tags |
| Steps to reproduce | Start the API with the seed data. Request `GET /api/courses?tag=ai`, then `GET /api/courses?tag=AI`. |
| Observed | `tag=ai` returns `course-001` and `course-005`; `tag=AI` returns `200` with an empty `items` array. `tag=Security` also returns nothing. |
| Expected | Both requests return `course-001` and `course-005`. The tag filter matches regardless of letter case, as documented. |

### Observed response

```http
GET /api/courses?tag=AI
```

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "totalItems": 0,
  "totalPages": 0
}
```

### Expected response

```http
GET /api/courses?tag=AI
```

```json
{
  "items": [
    {
      "id": "course-001",
      "title": "AI Security Foundations",
      "summary": "Introductory course on secure AI-assisted development.",
      "modality": "online",
      "status": "active",
      "tags": ["ai", "security"],
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    },
    {
      "id": "course-005",
      "title": "Building with AI Agents",
      "summary": "Hands-on agent development.",
      "modality": "online",
      "status": "active",
      "tags": ["ai", "agents"],
      "createdAt": "2026-03-20T00:00:00.000Z",
      "updatedAt": "2026-04-15T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 2,
  "totalPages": 1
}
```

## Functional requirements

| ID | Requirement |
| --- | --- |
| F1 | Reproduce the defect with a test before changing production code. |
| F2 | The `tag` filter matches a course when one of its tags equals the requested tag, ignoring letter case. |
| F3 | The `tag` filter stays an exact tag match: a partial tag such as `a` or `sec` matches nothing. |
| F4 | `tag` keeps combining with `q`, `modality`, `status`, pagination, and sorting. |
| F5 | Keyword search (`q`), the `modality` and `status` filters, pagination, sorting, and query validation are unchanged. |
| F6 | Invalid query parameters still return HTTP 400 with code `INVALID_QUERY_PARAMETER`. |
| F7 | Add a regression test that fails before the fix and passes after it. |
| F8 | Existing tests must still pass. |

## Error response format

Unchanged from the existing API:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      {
        "field": "pageSize",
        "message": "pageSize must be between 1 and 50."
      }
    ]
  }
}
```

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| F-AC1 | `GET /api/courses?tag=AI` returns `course-001` and `course-005`, the same courses as `tag=ai`. |
| F-AC2 | Mixed-case tags (`tag=Security`, `tag=sEcUrItY`) return `course-001` and `course-006`. |
| F-AC3 | Lowercase `tag=ai` still returns `course-001` and `course-005`. |
| F-AC4 | The tag filter stays exact: `tag=A` and `tag=sec` return 200 with an empty `items` array. |
| F-AC5 | A mixed-case tag combines with other filters: `tag=AI&status=active&modality=online` returns `course-001` and `course-005`; `tag=SECURITY&q=review` returns `course-006`. |
| F-AC6 | Keyword search is unchanged: `q=SECURITY` returns `course-001`, `course-003`, `course-006` in title order. |
| F-AC7 | Pagination and validation are unchanged: `tag=ai&pageSize=1&page=2` returns `course-005` with `totalItems` 2 and `totalPages` 2; `pageSize=0` and `modality=x` return 400 `INVALID_QUERY_PARAMETER`. |
| F-AC8 | A regression test for the defect is added. |
| F-AC9 | Existing tests still pass. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Regression | A tag sent in a different letter case than stored matches the course |
| Exact match | A partial tag does not match |
| Existing tests | Previously existing tests still pass |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Fix | Root-cause fix for the tag filter |
| Tests | Regression test for the defect |
| Notes | Short summary of the root cause, the fix, and any limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
