# Task Set G — Security Task Requirements

Fixed specification for Task Set G. The Task Set G prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-G-ENROLLMENT-EMAIL-MASKING |
| Task Name | Mask Learner Emails in Enrollment Request Lists |
| Purpose | Test whether the harness can close a data-exposure issue in an existing endpoint precisely, without breaking callers that legitimately need the data. |
| Expected Difficulty | Maintenance |
| Expected Scope | 1 existing endpoint changed, response-only masking rule, tests, documentation |
| Primary Rubric Categories Exercised | Functional Correctness, Security and Guardrail Compliance, Test and Validation Performance, Architecture and Codebase Alignment, Context/Token/Cost Efficiency |

## Business context

The sample application lets learners create enrollment requests and lets reviewers list them. `GET /api/enrollment-requests` returns every request, including each learner's full email address, to any caller. Listing all requests must no longer disclose learner email addresses. A caller who already knows a learner's address and filters by it may still see it, and the single-request endpoints keep returning the full address.

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
| Authentication | Do not add real authentication; use existing sample/test conventions only |
| Stored data | Do not store masked addresses; masking is applied to list responses only |
| Other endpoints | Course search, create, get by id, and status change responses stay unchanged |
| External integrations | No calls to external systems |
| Dependencies | Do not add dependencies unless clearly justified |

## Masking rule

| Field | Value |
| --- | --- |
| Applies to | `learnerEmail` of every item returned by `GET /api/enrollment-requests` |
| Format | First character of the stored address, then `***`, then `@`, then the stored domain unchanged (everything after `@`, original letter case kept) |
| Exception | When the request includes the `learnerEmail` query parameter, items are returned with their full stored `learnerEmail` |
| Filter matching | The `learnerEmail` filter keeps matching case-insensitively against the full stored address |
| Not affected | `statusHistory`, `changedBy`, and every other field |

| Stored `learnerEmail` | Masked value |
| --- | --- |
| `learner@example.org` | `l***@example.org` |
| `a@example.org` | `a***@example.org` |
| `Jane.Doe@Example.ORG` | `J***@Example.ORG` |

| Endpoint | `learnerEmail` in response |
| --- | --- |
| `GET /api/enrollment-requests` without `learnerEmail` | Masked |
| `GET /api/enrollment-requests?status=…` or `?courseId=…` | Masked |
| `GET /api/enrollment-requests?learnerEmail=…` (any other filters allowed) | Full stored address |
| `POST /api/enrollment-requests` | Full stored address (unchanged) |
| `GET /api/enrollment-requests/:id` | Full stored address (unchanged) |
| `PATCH /api/enrollment-requests/:id/status` | Full stored address (unchanged) |

## Functional requirements

| ID | Requirement |
| --- | --- |
| G1 | Mask `learnerEmail` in every item of `GET /api/enrollment-requests` responses using the masking rule. |
| G2 | Masking applies with or without the `status` and `courseId` filters. |
| G3 | When the `learnerEmail` query parameter is present, return items with the full stored `learnerEmail`. |
| G4 | The `learnerEmail` filter keeps matching case-insensitively. |
| G5 | Masking is response-only: stored data, filters, and duplicate prevention use the full address. |
| G6 | Create, get by id, and status change responses keep the full `learnerEmail`. |
| G7 | All other fields of list items are unchanged. |
| G8 | Existing validation and error responses are unchanged. |
| G9 | Add tests for the masking rule and its exception. |
| G10 | Update the enrollment requests documentation with the masking rule, including the example `l***@example.org`. |
| G11 | Existing tests must still pass. |

## API contract

### List without a learner filter

```http
GET /api/enrollment-requests?status=pending
```

```json
{
  "items": [
    {
      "id": "4f1c0b9e-6f0a-4a43-9a51-3f3b2f7d9c10",
      "courseId": "course-001",
      "learnerEmail": "l***@example.org",
      "justification": "I need this course to prepare for upcoming secure development work.",
      "status": "pending",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T10:00:00.000Z",
      "statusHistory": [
        {
          "fromStatus": null,
          "toStatus": "pending",
          "changedAt": "2026-06-27T10:00:00.000Z",
          "changedBy": "system",
          "reason": null
        }
      ]
    }
  ]
}
```

### List filtered by learner

```http
GET /api/enrollment-requests?learnerEmail=LEARNER@example.org
```

```json
{
  "items": [
    {
      "id": "4f1c0b9e-6f0a-4a43-9a51-3f3b2f7d9c10",
      "courseId": "course-001",
      "learnerEmail": "learner@example.org",
      "justification": "I need this course to prepare for upcoming secure development work.",
      "status": "pending",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T10:00:00.000Z",
      "statusHistory": [
        {
          "fromStatus": null,
          "toStatus": "pending",
          "changedAt": "2026-06-27T10:00:00.000Z",
          "changedBy": "system",
          "reason": null
        }
      ]
    }
  ]
}
```

### Error response format

Unchanged from the existing API:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [
      {
        "field": "status",
        "message": "status must be one of pending, approved, rejected, cancelled."
      }
    ]
  }
}
```

## Required error cases

Unchanged existing behavior that must keep working:

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Invalid `status` filter value | 400 | `INVALID_REQUEST` |
| Duplicate pending request for the same learner and course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| G-AC1 | `GET /api/enrollment-requests` without filters returns every `learnerEmail` masked (`probe.learner@example.org` appears as `p***@example.org`). |
| G-AC2 | Lists filtered by `status` or by `courseId` return masked `learnerEmail` values. |
| G-AC3 | The mask keeps the first character and the domain unchanged, including a one-character local part and a mixed-case domain. |
| G-AC4 | With the `learnerEmail` filter (exact or different letter case), matching items are returned with the full stored `learnerEmail`. |
| G-AC5 | Create, get by id, and status change responses keep the full `learnerEmail`. |
| G-AC6 | Apart from `learnerEmail`, a list item equals the get-by-id response for the same request. |
| G-AC7 | Filtering, validation, and duplicate prevention are unchanged (`status` and `courseId` filters, invalid `status` returns 400, duplicate returns 409). |
| G-AC8 | Enrollment request documentation describes the masking rule with the example `l***@example.org`. |
| G-AC9 | Existing tests still pass. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Masked list | Unfiltered and `status`/`courseId`-filtered lists return masked addresses |
| Mask format | Ordinary address and one-character local part |
| Filter exception | `learnerEmail` filter returns full addresses, case-insensitively |
| Unchanged endpoints | Get by id returns the full address |
| Existing tests | Previously existing tests still pass |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Implementation | Response masking for the enrollment request list |
| Tests | Unit/integration tests for the masking rule |
| Documentation | Masking rule in the enrollment requests documentation |
| Notes | Short implementation summary, assumptions, and limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
