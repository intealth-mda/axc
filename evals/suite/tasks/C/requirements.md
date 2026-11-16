# Task Set C — Instructor Directory Requirements

Fixed specification for Task Set C. The Task Set C prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-C-INSTRUCTOR-DIRECTORY |
| Task Name | Instructor Directory |
| Purpose | Test whether the harness can implement a small read-only feature with fixed seed data, filtering, pagination, validation, tests, and documentation. |
| Expected Difficulty | Baseline |
| Expected Scope | 2 read-only endpoints, 1 domain model, fixed seed data, search, filters, pagination, validation, tests, documentation |
| Primary Rubric Categories Exercised | Functional Correctness, Test and Validation Performance, Architecture and Codebase Alignment, Security and Guardrail Compliance, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

The sample application needs an instructor directory. Learners and coordinators look up instructors by name, narrow the list by department and by whether the instructor is currently active, and open a single instructor's record.

The directory is read-only. The implementation must follow the existing project structure and coding conventions. The feature must be testable without external services or production data.

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
| Authentication | Do not add or alter authentication unless the sample app already has a local test-only pattern |
| Unrelated domains | Do not change unrelated features |
| External integrations | Do not call external APIs or services |
| Dependencies | Do not add new dependencies unless clearly justified in implementation notes |

## Data model

Create an Instructor model with these fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique instructor ID |
| `name` | string | Yes | Full name |
| `email` | string | Yes | Contact email |
| `department` | enum | Yes | `engineering`, `data`, `security`, `design` |
| `title` | string | Yes | Job title |
| `active` | boolean | Yes | `true` while the instructor is currently teaching |

## Seed data

The directory must contain exactly these 10 instructors, with these ids and field values:

| `id` | `name` | `email` | `department` | `title` | `active` |
| --- | --- | --- | --- | --- | --- |
| `instructor-001` | Priya Raman | priya.raman@example.org | `security` | Principal Instructor | `true` |
| `instructor-002` | Marcus Chen | marcus.chen@example.org | `engineering` | Senior Instructor | `true` |
| `instructor-003` | Elena Petrova | elena.petrova@example.org | `data` | Instructor | `true` |
| `instructor-004` | Samuel Okafor | samuel.okafor@example.org | `engineering` | Instructor | `false` |
| `instructor-005` | Hannah Brooks | hannah.brooks@example.org | `design` | Senior Instructor | `true` |
| `instructor-006` | Diego Alvarez | diego.alvarez@example.org | `security` | Instructor | `true` |
| `instructor-007` | Mei Tanaka | mei.tanaka@example.org | `data` | Principal Instructor | `false` |
| `instructor-008` | Liam Walsh | liam.walsh@example.org | `engineering` | Instructor | `true` |
| `instructor-009` | Fatima Haddad | fatima.haddad@example.org | `data` | Senior Instructor | `true` |
| `instructor-010` | Noah Fischer | noah.fischer@example.org | `design` | Instructor | `false` |

## Functional requirements

| ID | Requirement |
| --- | --- |
| C1 | Add a `GET /api/instructors` endpoint. |
| C2 | Return only instructors matching every requested filter. |
| C3 | Support search using query parameter `q`. `q` matches when it appears anywhere in the instructor `name`, case-insensitively. |
| C4 | Support filter `department` with allowed values `engineering`, `data`, `security`, and `design`. |
| C5 | Support filter `active` with allowed values `true` and `false` (exactly these lowercase strings). |
| C6 | Support pagination using `page` and `pageSize`. `page` defaults to 1. `pageSize` defaults to 10. Both must be integers; `page` must be 1 or more; `pageSize` must be between 1 and 50. |
| C7 | Results are ordered by `name` ascending (A to Z). |
| C8 | `totalPages` is `totalItems / pageSize` rounded up, so it is `0` when nothing matches. A page past the last page returns `200` with an empty `items` array. |
| C9 | Invalid query parameters must return HTTP 400 with error code `INVALID_QUERY_PARAMETER` and one `details` entry per invalid parameter. Unrecognized query parameters are ignored. |
| C10 | Add a `GET /api/instructors/{id}` endpoint that returns one instructor. An unknown id returns HTTP 404 with error code `INSTRUCTOR_NOT_FOUND`. |
| C11 | Add or update tests covering success, search, filters, pagination, validation failures, lookup by id, and not found. |
| C12 | Add or update API documentation for instructors. |

## API contract

### List request

```http
GET /api/instructors?q=an&department=design&active=true&page=1&pageSize=5
```

### List response

```json
{
  "items": [
    {
      "id": "instructor-005",
      "name": "Hannah Brooks",
      "email": "hannah.brooks@example.org",
      "department": "design",
      "title": "Senior Instructor",
      "active": true
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

### Get by id request

```http
GET /api/instructors/instructor-003
```

### Get by id response

```json
{
  "id": "instructor-003",
  "name": "Elena Petrova",
  "email": "elena.petrova@example.org",
  "department": "data",
  "title": "Instructor",
  "active": true
}
```

### Error response format

All errors use this format.

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      {
        "field": "department",
        "message": "department must be one of engineering, data, security, design."
      }
    ]
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Unknown `department` value | 400 | `INVALID_QUERY_PARAMETER` |
| `active` other than `true` or `false` | 400 | `INVALID_QUERY_PARAMETER` |
| `page` not an integer or less than 1 | 400 | `INVALID_QUERY_PARAMETER` |
| `pageSize` not an integer, less than 1, or more than 50 | 400 | `INVALID_QUERY_PARAMETER` |
| Instructor id not found | 404 | `INSTRUCTOR_NOT_FOUND` |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| C-AC1 | `GET /api/instructors` returns all 10 seeded instructors ordered by name, with `page` 1, `pageSize` 10, `totalItems` 10, and `totalPages` 1. |
| C-AC2 | `GET /api/instructors?q=AN` returns exactly the instructors whose name contains "an", regardless of case. |
| C-AC3 | `GET /api/instructors?department=data` returns only the data instructors. |
| C-AC4 | `GET /api/instructors?active=false` returns only inactive instructors, and `active=true` only active ones. |
| C-AC5 | `GET /api/instructors?department=engineering&active=true` applies both filters together. |
| C-AC6 | `GET /api/instructors?page=2&pageSize=4` returns the 5th to 8th instructors by name with correct metadata; a page past the last returns 200 with an empty `items` array. |
| C-AC7 | A search with no matches returns 200 with an empty `items` array and `totalItems` 0, not an error. |
| C-AC8 | Invalid `department`, `active`, `page`, or `pageSize` values return HTTP 400 with `INVALID_QUERY_PARAMETER` and a `details` entry naming the parameter. |
| C-AC9 | `GET /api/instructors/{id}` returns the full seeded record for that instructor. |
| C-AC10 | `GET /api/instructors/{id}` for an unknown id returns 404 with `INSTRUCTOR_NOT_FOUND`. |
| C-AC11 | Existing tests still pass. |
| C-AC12 | New tests cover the main success path, search, both filters, pagination, invalid query parameters, lookup by id, and not found. |
| C-AC13 | Documentation includes both endpoint paths, query parameters, success responses, and error responses. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Default list | Returns all instructors with default page and page size |
| Search | Case-insensitive name match |
| Filters | `department` and `active` |
| Combined filters | At least one request combining `q` or `department` with `active` |
| Pagination | Page and page size behavior, including a page past the last |
| Validation | Invalid `department`, invalid `active`, invalid `page`, invalid `pageSize` |
| No matches | Returns empty list with valid pagination metadata |
| Get by id | Existing instructor and unknown id |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Tests | Unit/integration tests for the new endpoints |
| Documentation | API documentation |
| Notes | Short summary of implementation decisions and any limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
