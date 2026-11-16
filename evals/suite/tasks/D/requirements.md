# Task Set D — Learning Resources Library Requirements

Fixed specification for Task Set D. The Task Set D prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-D-RESOURCE-LIBRARY |
| Task Name | Learning Resources Library |
| Purpose | Test whether the harness can implement a small create-and-read feature with request body validation, field-level error details, filtering, tests, and documentation. |
| Expected Difficulty | Baseline |
| Expected Scope | 3 endpoints, 1 domain model, body validation, filters, tests, documentation |
| Primary Rubric Categories Exercised | Functional Correctness, Test and Validation Performance, Architecture and Codebase Alignment, Security and Guardrail Compliance, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

The sample application needs a shared library of learning resources: articles, videos, external courses, and tools that instructors recommend alongside the catalog. Instructors add resources; learners browse them by type and tag.

Only secure links may be stored. The implementation must follow the existing project structure and coding conventions. The feature must be testable without external services or production data, and must never fetch the submitted URL.

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
| External integrations | Do not call external APIs or services, including the submitted resource URLs |
| Dependencies | Do not add new dependencies unless clearly justified in implementation notes |

## Data model

Create a Resource model with these fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique resource ID, assigned by the server |
| `title` | string | Yes | Stored trimmed; 3–120 characters |
| `url` | string | Yes | Absolute URL with the `https` scheme |
| `type` | enum | Yes | `article`, `video`, `course`, `tool` |
| `tags` | string[] | Yes | 0–5 tags, each 1–30 characters, stored trimmed and lowercased; `[]` when omitted |
| `createdAt` | string | Yes | ISO date string, assigned by the server |

The library starts empty each time the API starts. There is no seed data.

## Functional requirements

| ID | Requirement |
| --- | --- |
| D1 | Add `POST /api/resources` to create a resource. A valid request returns HTTP 201 with the created resource. |
| D2 | `title` is required, must be a string, and must be 3 to 120 characters after trimming. |
| D3 | `url` is required and must parse as an absolute URL whose scheme is `https`. `http`, other schemes, and relative or malformed values are rejected. |
| D4 | `type` is required and must be one of `article`, `video`, `course`, `tool`. |
| D5 | `tags` is optional. When present it must be an array of 0 to 5 strings, each 1 to 30 characters after trimming. Tags are stored trimmed and lowercased. |
| D6 | An invalid body returns HTTP 400 with error code `INVALID_REQUEST` and one `details` entry for every invalid field, not just the first. A body that is not valid JSON returns the same 400. Nothing is stored when a request is rejected. |
| D7 | Unrecognized body fields are ignored. Clients cannot set `id` or `createdAt`. |
| D8 | Add `GET /api/resources` returning `{ "items": [...] }` in creation order (oldest first). |
| D9 | Support filter `type` (same allowed values as D4) and filter `tag` (matches a resource that has the tag, case-insensitively). Filters combine. |
| D10 | An invalid `type` filter returns HTTP 400 with error code `INVALID_QUERY_PARAMETER`. |
| D11 | Add `GET /api/resources/{id}`. An unknown id returns HTTP 404 with error code `RESOURCE_NOT_FOUND`. |
| D12 | Add or update tests covering creation, each validation rule, retrieval, filtering, and not found. |
| D13 | Add or update API documentation for resources. |

## API contract

### Create resource

`POST /api/resources`

Request body:

```json
{
  "title": "Threat Modeling for Web APIs",
  "url": "https://example.org/articles/threat-modeling",
  "type": "article",
  "tags": ["Security", "api"]
}
```

Successful response (`201`):

```json
{
  "id": "res-7f3a",
  "title": "Threat Modeling for Web APIs",
  "url": "https://example.org/articles/threat-modeling",
  "type": "article",
  "tags": ["security", "api"],
  "createdAt": "2026-06-27T10:00:00.000Z"
}
```

### Get resource by ID

```http
GET /api/resources/res-7f3a
```

### List resources

```http
GET /api/resources?type=article&tag=security
```

Successful response (`200`):

```json
{
  "items": [
    {
      "id": "res-7f3a",
      "title": "Threat Modeling for Web APIs",
      "url": "https://example.org/articles/threat-modeling",
      "type": "article",
      "tags": ["security", "api"],
      "createdAt": "2026-06-27T10:00:00.000Z"
    }
  ]
}
```

### Error response format

All errors use this format.

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [
      {
        "field": "url",
        "message": "url must be an absolute https URL."
      },
      {
        "field": "type",
        "message": "type must be one of article, video, course, tool."
      }
    ]
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Missing title, or title shorter than 3 or longer than 120 characters | 400 | `INVALID_REQUEST` |
| Missing url, non-https url, or malformed url | 400 | `INVALID_REQUEST` |
| Missing or unknown type | 400 | `INVALID_REQUEST` |
| tags not an array, more than 5 tags, or a tag outside 1–30 characters | 400 | `INVALID_REQUEST` |
| Body is not valid JSON | 400 | `INVALID_REQUEST` |
| Unknown `type` query filter | 400 | `INVALID_QUERY_PARAMETER` |
| Resource id not found | 404 | `RESOURCE_NOT_FOUND` |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| D-AC1 | A valid `POST /api/resources` returns 201 with a server-assigned `id` and `createdAt`, the submitted fields, and tags trimmed and lowercased. |
| D-AC2 | `GET /api/resources/{id}` returns the created resource. |
| D-AC3 | `GET /api/resources/{id}` for an unknown id returns 404 with `RESOURCE_NOT_FOUND`. |
| D-AC4 | A missing title, or a title shorter than 3 or longer than 120 characters, returns 400 `INVALID_REQUEST` with a `title` detail. |
| D-AC5 | An `http` URL, a non-web scheme, or a malformed URL returns 400 `INVALID_REQUEST` with a `url` detail. |
| D-AC6 | A missing or unknown `type` returns 400 `INVALID_REQUEST` with a `type` detail. |
| D-AC7 | Six tags, a non-array `tags`, or an empty or 31-character tag returns 400 with a `tags` detail; omitted `tags` stores `[]` and exactly 5 tags is accepted. |
| D-AC8 | A body with several invalid fields returns one `details` entry for each of them. |
| D-AC9 | `GET /api/resources` lists resources in creation order and supports the `type` and `tag` filters, alone and combined, with `tag` matching case-insensitively. |
| D-AC10 | An unknown `type` filter returns 400 with `INVALID_QUERY_PARAMETER`. |
| D-AC11 | Rejected requests store nothing: the list contains only the resources created by valid requests. |
| D-AC12 | Existing tests still pass. |
| D-AC13 | New tests cover creation, each validation rule, retrieval, filtering, and not found. |
| D-AC14 | Documentation describes all three endpoints, the request body and its rules, response bodies, and error cases. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Create | Valid request returns 201 and the stored resource |
| Title | Missing, too short, too long |
| URL | `http`, malformed, missing |
| Type | Missing, unknown |
| Tags | Omitted, exactly 5, more than 5, invalid tag length, tag normalization |
| Multiple errors | Several invalid fields reported together |
| Retrieve by ID | Existing resource and unknown id |
| List/filter | `type`, `tag` (case-insensitive), combined, invalid `type` |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Tests | Unit/integration tests for the new endpoints |
| Documentation | API documentation |
| Notes | Short summary of implementation decisions and any limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
