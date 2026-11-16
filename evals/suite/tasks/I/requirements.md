# Task Set I — Extension Task Requirements

Fixed specification for Task Set I. The Task Set I prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-I-COURSE-SORT-DIRECTION |
| Task Name | Course Search Sort Direction |
| Purpose | Test whether the harness can extend an existing query contract consistently across validation, domain logic, tests, and documentation without regressing current behavior. |
| Expected Difficulty | Maintenance |
| Expected Scope | 1 existing endpoint extended, validation update, tests, documentation |
| Primary Rubric Categories Exercised | Functional Correctness, Test and Validation Performance, Architecture and Codebase Alignment, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

The sample application exposes `GET /api/courses`, which sorts results by `title`, `createdAt`, or `updatedAt` in ascending order only. Catalog users want to see the newest or most recently updated courses first. The sort parameter must support a descending direction for every sort field while keeping existing ascending requests unchanged.

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
| Production configuration | No production settings, secrets, deployment, or environment changes |
| Authentication | Do not add or alter authentication |
| Course seed data | Do not add, remove, or change courses in the seed |
| Response shape | Do not change the course search response fields or the error format |
| Unrelated domains | Do not change enrollment requests or other unrelated features |
| External integrations | No calls to external systems |
| Dependencies | Do not add dependencies unless clearly justified |

## Sort parameter

| Value | Order |
| --- | --- |
| `title` (default) | `title` ascending |
| `createdAt` | `createdAt` ascending |
| `updatedAt` | `updatedAt` ascending |
| `-title` | `title` descending |
| `-createdAt` | `createdAt` descending |
| `-updatedAt` | `updatedAt` descending |

Field names are case-sensitive. Any other value returns HTTP 400 `INVALID_QUERY_PARAMETER` with a `details` entry whose `field` is `sort`. Invalid examples: `unknown`, `-unknown`, `-`, `--title`, `-Title`, `id`, `-id`.

## Expected order on the seed data

Course ids returned by `GET /api/courses?sort=<value>` with the default page size, using the unchanged course seed:

| `sort` | Expected `items[].id` order |
| --- | --- |
| (none) or `title` | `course-001`, `course-005`, `course-002`, `course-003`, `course-004`, `course-006` |
| `-title` | `course-006`, `course-004`, `course-003`, `course-002`, `course-005`, `course-001` |
| `createdAt` | `course-004`, `course-003`, `course-006`, `course-001`, `course-002`, `course-005` |
| `-createdAt` | `course-005`, `course-002`, `course-001`, `course-006`, `course-003`, `course-004` |
| `updatedAt` | `course-004`, `course-006`, `course-003`, `course-005`, `course-002`, `course-001` |
| `-updatedAt` | `course-001`, `course-002`, `course-005`, `course-003`, `course-006`, `course-004` |

## Functional requirements

| ID | Requirement |
| --- | --- |
| I1 | Accept `-title`, `-createdAt`, and `-updatedAt` and sort descending by that field. |
| I2 | Keep `title`, `createdAt`, and `updatedAt` ascending. The default sort stays `title` ascending. |
| I3 | Sort the full matched set before pagination. Sorting works with `q`, `modality`, `status`, and `tag`. |
| I4 | Any other `sort` value returns HTTP 400 `INVALID_QUERY_PARAMETER` with a `details` entry for `sort`. |
| I5 | Other query parameter validation is unchanged. |
| I6 | Add or update tests for descending sort, ascending sort, descending sort with pagination, and invalid sort values. |
| I7 | Update the courses documentation to list the descending values and include the example `sort=-createdAt`. |
| I8 | Existing tests must still pass. |

## API contract

### Request

```http
GET /api/courses?status=active&sort=-createdAt&page=2&pageSize=2
```

### Successful response

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
      "id": "course-006",
      "title": "Secure Code Review",
      "summary": "Finding vulnerabilities in pull requests.",
      "modality": "online",
      "status": "active",
      "tags": ["security"],
      "createdAt": "2025-12-05T00:00:00.000Z",
      "updatedAt": "2026-02-01T00:00:00.000Z"
    }
  ],
  "page": 2,
  "pageSize": 2,
  "totalItems": 4,
  "totalPages": 2
}
```

### Error response

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      {
        "field": "sort",
        "message": "sort must be one of title, createdAt, updatedAt, -title, -createdAt, -updatedAt."
      }
    ]
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Unknown field (`unknown`, `id`) | 400 | `INVALID_QUERY_PARAMETER` |
| Unknown field with prefix (`-unknown`, `-id`) | 400 | `INVALID_QUERY_PARAMETER` |
| Prefix only (`-`) | 400 | `INVALID_QUERY_PARAMETER` |
| Repeated prefix (`--title`) | 400 | `INVALID_QUERY_PARAMETER` |
| Wrong letter case (`-Title`) | 400 | `INVALID_QUERY_PARAMETER` |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| I-AC1 | `GET /api/courses?sort=-createdAt` returns courses in the expected `-createdAt` order. |
| I-AC2 | `GET /api/courses?sort=-updatedAt` returns courses in the expected `-updatedAt` order. |
| I-AC3 | `GET /api/courses?sort=-title` returns courses in the expected `-title` order. |
| I-AC4 | Ascending sorts and the default sort return the expected ascending orders. |
| I-AC5 | `GET /api/courses?status=active&sort=-createdAt&page=2&pageSize=2` returns `course-001`, `course-006` with `totalItems` 4 and `totalPages` 2. |
| I-AC6 | Every invalid `sort` value in the error table returns 400 `INVALID_QUERY_PARAMETER` with a `details` entry for `sort`. |
| I-AC7 | Courses documentation describes the descending prefix with the example `sort=-createdAt`. |
| I-AC8 | Existing tests still pass. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Descending sort | Each of `-title`, `-createdAt`, `-updatedAt` |
| Ascending sort | At least one ascending field and the default |
| Pagination | Descending sort combined with a filter and a second page |
| Validation | `-unknown`, `-`, `--title` |
| Existing tests | Previously existing tests still pass |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Implementation | Descending sort support and validation |
| Tests | Unit/integration tests for sort direction |
| Documentation | Updated courses documentation |
| Notes | Short implementation summary, assumptions, and limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
