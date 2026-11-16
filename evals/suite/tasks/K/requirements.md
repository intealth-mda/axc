# Task Set K — Bulk Enrollment Request Status Change Requirements

Fixed specification for Task Set K. The Task Set K prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-K-BULK-STATUS-CHANGE |
| Task Name | Bulk Enrollment Request Status Change |
| Purpose | Test whether the harness can add an atomic multi-record operation to an existing workflow, reusing its rules, reporting every failure, and preserving existing behavior. |
| Expected Difficulty | Expanded |
| Expected Scope | 1 new endpoint on an existing workflow, body validation, all-or-nothing semantics, aggregated error reporting, audit entries, tests, documentation |
| Primary Rubric Categories Exercised | All rubric categories |

## Starting point

The codebase already implements:

| Feature | Endpoints |
| --- | --- |
| Course search | `GET /api/courses` with `q`, `modality`, `status`, `tag`, `page`, `pageSize`, `sort` |
| Enrollment requests | `POST /api/enrollment-requests`, `GET /api/enrollment-requests`, `GET /api/enrollment-requests/{id}`, `PATCH /api/enrollment-requests/{id}/status` |

The single status change already enforces: `status` is one of `pending`, `approved`, `rejected`, `cancelled`; `changedBy` is required; `reason` is required when rejecting; valid transitions are `pending` → `approved`, `pending` → `rejected`, `pending` → `cancelled`, and `approved` → `cancelled`; every change appends a `statusHistory` entry. All existing behavior must be preserved.

## Business context

Reviewers process enrollment requests in batches, for example approving every pending request for a cohort at once. A batch must never be half-applied: if any request in it cannot be moved, nothing changes and the reviewer gets the complete list of problems so they can fix the batch and submit it again.

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
| `packages/axc/**` | Do not create any additional directories beyond what already exist |
| `packages/axc-verification/**` | Unit, integration, architectural, and acceptance tests |
| `apps/docs/**` | MADR / API documentation |

## Do not modify

The harness must not modify:

| Area | Rule |
| --- | --- |
| Production configuration | No production settings, secrets, deployment, or environment changes |
| Authentication | Do not add real authentication; use existing sample/test conventions only |
| External integrations | No calls to external systems |
| Database infrastructure | Do not introduce a real database if the sample app uses in-memory or file-based fixtures |
| Unrelated domains | Do not change unrelated features |
| Dependencies | Do not add dependencies unless clearly justified |

## Domain models

The EnrollmentRequest and StatusHistoryEntry models are unchanged.

### BulkStatusChange (request body)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `ids` | string[] | Yes | 1–50 entries; each a non-empty string; no id may appear twice |
| `status` | enum | Yes | `pending`, `approved`, `rejected`, `cancelled` |
| `changedBy` | string | Yes | Non-empty; recorded on every history entry |
| `reason` | string | No | Required and non-empty when `status` is `rejected`; recorded on every history entry |

### BulkStatusFailure

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | The failing request id, as submitted |
| `code` | string | Yes | `ENROLLMENT_REQUEST_NOT_FOUND` or `INVALID_STATUS_TRANSITION` |
| `message` | string | Yes | Human-readable reason |

## Functional requirements

| ID | Requirement |
| --- | --- |
| K1 | Add `POST /api/enrollment-requests/bulk-status`. |
| K2 | Validate the body first. A body that is not valid JSON, or breaks a rule in the BulkStatusChange table, returns HTTP 400 with error code `INVALID_REQUEST` and a `details` entry naming each invalid field (`ids`, `status`, `changedBy`, `reason`). Nothing changes. |
| K3 | Then evaluate every id: the request must exist, and moving it from its current status to `status` must be a valid transition. |
| K4 | If one or more ids fail K3, return HTTP 409 with error code `BULK_STATUS_CHANGE_FAILED`. The error object carries a `failures` array with one BulkStatusFailure for every failing id, in the order the ids were submitted, and no entry for ids that would have succeeded. No request changes and no `statusHistory` entry is added. |
| K5 | If every id passes K3, every request moves to `status` and gets one new `statusHistory` entry with `fromStatus` (its previous status), `toStatus`, `changedAt`, `changedBy`, and `reason` (`null` when not given). Return HTTP 200 with `{ "items": [...] }` holding every updated request, in the order the ids were submitted. |
| K6 | The single-request `PATCH /api/enrollment-requests/{id}/status` and all other existing endpoints behave exactly as before. |
| K7 | Add or update tests for a successful bulk change, audit entries, validation failures, missing ids, invalid transitions, the full failure list, and the all-or-nothing guarantee. |
| K8 | Add or update API documentation for enrollment requests. |
| K9 | Existing tests must still pass. |

## API contracts

### Bulk status change

`POST /api/enrollment-requests/bulk-status`

Request body:

```json
{
  "ids": ["enroll-001", "enroll-002"],
  "status": "approved",
  "changedBy": "reviewer@example.org"
}
```

Successful response (`200`):

```json
{
  "items": [
    {
      "id": "enroll-001",
      "courseId": "course-001",
      "learnerEmail": "learner@example.org",
      "justification": "I need this course to prepare for upcoming secure development work.",
      "status": "approved",
      "createdAt": "2026-06-27T10:00:00.000Z",
      "updatedAt": "2026-06-27T11:00:00.000Z",
      "statusHistory": [
        {
          "fromStatus": null,
          "toStatus": "pending",
          "changedAt": "2026-06-27T10:00:00.000Z",
          "changedBy": "system",
          "reason": null
        },
        {
          "fromStatus": "pending",
          "toStatus": "approved",
          "changedAt": "2026-06-27T11:00:00.000Z",
          "changedBy": "reviewer@example.org",
          "reason": null
        }
      ]
    },
    {
      "id": "enroll-002",
      "courseId": "course-005",
      "learnerEmail": "second.learner@example.org",
      "justification": "Our team is adopting agent tooling and I will lead the rollout.",
      "status": "approved",
      "createdAt": "2026-06-27T10:30:00.000Z",
      "updatedAt": "2026-06-27T11:00:00.000Z",
      "statusHistory": [
        {
          "fromStatus": null,
          "toStatus": "pending",
          "changedAt": "2026-06-27T10:30:00.000Z",
          "changedBy": "system",
          "reason": null
        },
        {
          "fromStatus": "pending",
          "toStatus": "approved",
          "changedAt": "2026-06-27T11:00:00.000Z",
          "changedBy": "reviewer@example.org",
          "reason": null
        }
      ]
    }
  ]
}
```

Failed response (`409`), nothing changed:

```json
{
  "error": {
    "code": "BULK_STATUS_CHANGE_FAILED",
    "message": "No requests were changed because 2 of 3 requests cannot be moved to approved.",
    "details": [
      {
        "field": "ids",
        "message": "2 of 3 requests cannot be moved to approved."
      }
    ],
    "failures": [
      {
        "id": "enroll-404",
        "code": "ENROLLMENT_REQUEST_NOT_FOUND",
        "message": "Enrollment request enroll-404 was not found."
      },
      {
        "id": "enroll-003",
        "code": "INVALID_STATUS_TRANSITION",
        "message": "Cannot change status from rejected to approved."
      }
    ]
  }
}
```

### Error response format

Use the existing error format. Only `BULK_STATUS_CHANGE_FAILED` adds the `failures` array.

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [
      {
        "field": "ids",
        "message": "ids must contain between 1 and 50 distinct request ids."
      }
    ]
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| `ids` missing, not an array, empty, more than 50, containing a non-string or empty string, or containing a duplicate | 400 | `INVALID_REQUEST` |
| Unknown `status` value | 400 | `INVALID_REQUEST` |
| Missing or empty `changedBy` | 400 | `INVALID_REQUEST` |
| `status` is `rejected` without a non-empty `reason` | 400 | `INVALID_REQUEST` |
| Body is not valid JSON | 400 | `INVALID_REQUEST` |
| Any id not found | 409 | `BULK_STATUS_CHANGE_FAILED` (failure code `ENROLLMENT_REQUEST_NOT_FOUND`) |
| Any transition not allowed | 409 | `BULK_STATUS_CHANGE_FAILED` (failure code `INVALID_STATUS_TRANSITION`) |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| K-AC1 | A valid bulk approval of several pending requests returns 200 with every updated request in submitted order, and each request reads back as `approved`. |
| K-AC2 | Each request moved by a bulk change gets exactly one new `statusHistory` entry with the right `fromStatus`, `toStatus`, `changedBy`, and `reason`. |
| K-AC3 | A bulk rejection without a reason returns 400 `INVALID_REQUEST` and changes nothing; with a reason it succeeds and records the reason on every entry. |
| K-AC4 | A batch containing an unknown id returns 409 `BULK_STATUS_CHANGE_FAILED` listing that id with `ENROLLMENT_REQUEST_NOT_FOUND`, and the other requests in the batch are unchanged. |
| K-AC5 | A batch containing a request whose transition is invalid returns 409 `BULK_STATUS_CHANGE_FAILED` listing that id with `INVALID_STATUS_TRANSITION`, and the other requests in the batch are unchanged. |
| K-AC6 | A batch with several failures lists every failing id with its own code, in submitted order, and lists no id that would have succeeded. |
| K-AC7 | An invalid body (empty, non-array, oversized, or duplicated `ids`; unknown `status`; missing `changedBy`) returns 400 `INVALID_REQUEST` with a `details` entry naming the field. |
| K-AC8 | The single-request `PATCH /api/enrollment-requests/{id}/status` still supports valid transitions, returns 409 for invalid ones, and requires a reason for rejection. |
| K-AC9 | Creating, retrieving, and listing enrollment requests and course search behave as before. |
| K-AC10 | Existing tests still pass. |
| K-AC11 | New tests cover a successful bulk change, audit entries, validation failures, missing ids, invalid transitions, the full failure list, and the all-or-nothing guarantee. |
| K-AC12 | Documentation describes the bulk endpoint, its request and response bodies, the all-or-nothing rule, the `failures` list, and its error cases. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Bulk success | Several pending requests approved in one call |
| Audit trail | One history entry per moved request with `changedBy` and `reason` |
| Validation | Each `ids` rule, unknown `status`, missing `changedBy`, rejection without reason |
| Missing id | Batch with an unknown id changes nothing |
| Invalid transition | Batch with an invalid transition changes nothing |
| Failure list | Every failing id listed with its own code, in submitted order |
| Regression | Single-request status change and existing enrollment request tests still pass |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Implementation | Endpoint, validation, service/repository changes, mapper |
| Tests | Unit/integration tests for the bulk status change |
| Documentation | Updated enrollment request API documentation |
| Notes | Short implementation summary, assumptions, and limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
