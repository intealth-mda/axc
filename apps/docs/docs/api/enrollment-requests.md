# Enrollment requests

Learners request a seat in an active course. Reviewers approve, reject, or cancel that request. Data is stored in memory and resets when the API process restarts. Routes are anonymous in this sample.

A request starts as `pending`. `pending` may become `approved`, `rejected`, or `cancelled`. `approved` may become `cancelled`. Any other change returns `409`.

Creation and every status change append `statusHistory`. The create entry uses `changedBy` `system` and `fromStatus` `null`.

## Create

```http
POST /api/enrollment-requests
```

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

| Field | Rule |
| --- | --- |
| `courseId` | Required. Course must exist and have status `active`. |
| `learnerEmail` | Required valid email. Comparison is case-insensitive. |
| `justification` | Required. 20–500 characters. |

`201` returns the pending request:

```json
{
  "id": "enroll-001",
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
```

One learner cannot hold more than one `pending` or `approved` request for the same course. `rejected` and `cancelled` do not block a new request.

## Read one

```http
GET /api/enrollment-requests/enroll-001
```

`200` returns the same object shape as create, including `statusHistory`.

## List

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

All filters are optional. `status` is `pending`, `approved`, `rejected`, or `cancelled`. `courseId` is exact. `learnerEmail` is case-insensitive. Results are ordered by `createdAt`, then `id`.

`200`

```json
{
  "items": []
}
```

## Update status

```http
PATCH /api/enrollment-requests/enroll-001/status
```

Approve:

```json
{
  "status": "approved",
  "changedBy": "reviewer@example.org"
}
```

Reject:

```json
{
  "status": "rejected",
  "changedBy": "reviewer@example.org",
  "reason": "Learner has not completed the prerequisite course."
}
```

| Field | Rule |
| --- | --- |
| `status` | `pending`, `approved`, `rejected`, or `cancelled`. |
| `changedBy` | Required non-empty reviewer or operator id. |
| `reason` | Required and non-empty when `status` is `rejected`. Stored as `null` when omitted. |

`200` returns the updated request. The new history entry records the previous status, the new status, `changedBy`, and `reason`.

## Errors

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [
      {
        "field": "justification",
        "message": "justification must be between 20 and 500 characters."
      }
    ]
  }
}
```

| Situation | Status | Code |
| --- | --- | --- |
| Invalid email, justification, status, or missing rejection reason | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Course is not `active` | 409 | `COURSE_NOT_ACTIVE` |
| Duplicate `pending` or `approved` request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Status transition is not allowed | 409 | `INVALID_STATUS_TRANSITION` |

Course search is documented in [Course search](./courses).
