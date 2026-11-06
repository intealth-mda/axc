---
title: Enrollment requests
---

# Enrollment requests

Requests use JSON. This sample adds no authentication or external integrations. `changedBy` is caller-supplied audit information, not verified identity. Storage lasts for one API process; see the [storage decision](../decisions/0001-in-memory-training.md).

## Create

`POST /api/enrollment-requests`

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course for my upcoming project."
}
```

`courseId` must reference an existing active course. `learnerEmail` must have a valid email format; surrounding whitespace is trimmed and the address is lowercased for storage, duplicate checks, and filtering. `justification` must contain 20–500 characters after trimming. Required fields must be strings. A learner can have at most one pending or approved request per course. Rejected or cancelled requests permit another request. Duplicate checks and saves are serialized in one transaction, including concurrent requests.

Success: **201** with the complete enrollment object. Client-supplied status, IDs, timestamps, and history are ignored. New requests always begin pending with a system audit entry.

```json
{
  "id": "enroll-<uuid>",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course for my upcoming project.",
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
```

## Retrieve

`GET /api/enrollment-requests/:id`

Success: **200** with the same complete enrollment object, including its entire `statusHistory`. A missing ID returns **404** `ENROLLMENT_REQUEST_NOT_FOUND`.

## List and filter

`GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org`

All filters are optional and combine with AND. `status` accepts `pending`, `approved`, `rejected`, or `cancelled`; `courseId` is an exact match; `learnerEmail` uses the normalized address. Empty filter values and invalid status/email values return **400** `INVALID_REQUEST`. Unknown query keys are ignored. Success: **200**, a JSON array of complete enrollment objects in creation order; no matches return `[]`. This endpoint has no pagination.

## Change status

`PATCH /api/enrollment-requests/:id/status`

Approval:

```json
{ "status": "approved", "changedBy": "reviewer@example.org" }
```

Rejection:

```json
{
  "status": "rejected",
  "changedBy": "reviewer@example.org",
  "reason": "Learner has not completed the prerequisite course."
}
```

`changedBy` must be a non-empty string after trimming. `reason` is optional except for rejection, which requires a non-empty trimmed string. If supplied, reason must be a string. Unknown body fields are ignored.

| Current status | Permitted next status |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |
| `rejected` | None |
| `cancelled` | None |

Success: **200** with the complete updated enrollment object. Every successful change updates `updatedAt` and appends one history entry with `fromStatus`, `toStatus`, `changedAt` (ISO timestamp equal to `updatedAt`), `changedBy`, and `reason` (null if absent). Creation history and earlier entries are retained. Repeating the current status is an invalid transition. Failed operations leave stored state and history unchanged.

## Errors

| Operation / error | HTTP status | Code |
| --- | --- | --- |
| Create for a missing course | 404 | `COURSE_NOT_FOUND` |
| Create for draft or retired course | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, course ID, or justification | 400 | `INVALID_REQUEST` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Retrieve/update missing request | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Invalid status value or list filter | 400 | `INVALID_REQUEST` |
| Forbidden transition, including same status | 409 | `INVALID_STATUS_TRANSITION` |
| Rejection without a non-empty reason | 400 | `INVALID_REQUEST` |
| Missing/blank actor or invalid reason type | 400 | `INVALID_REQUEST` |
| Malformed JSON, null, array, or non-object body | 400 | `INVALID_REQUEST` |

Every expected error has the envelope below. Validation details identify the invalid fields; conflicts and missing resources have `details: []`. Updating a missing request returns 404 before validating its status fields.

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [
      { "field": "justification", "message": "justification must be between 20 and 500 characters." }
    ]
  }
}
```
