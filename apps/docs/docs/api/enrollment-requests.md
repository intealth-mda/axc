---
title: Enrollment requests
---

# Enrollment requests

A learner submits one request to enroll in an active course. Reviewers approve, reject, or cancel that request. The API process keeps requests in memory, so they reset when the process stops. `changedBy` is the id sent by the caller. This sample does not authenticate it.

New requests always start as `pending`. A `status` field on create is ignored.

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
| `courseId` | Required. Must be an existing course with status `active`. |
| `learnerEmail` | Required. Must contain a local part, a domain, and a dot in the domain. Leading and trailing spaces are removed. Comparison is case-insensitive. |
| `justification` | Required. 20 through 500 characters. Spaces count. The value is stored unchanged. |

Success is `201` with the created request:

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

A learner cannot hold more than one `pending` or `approved` request for the same course. `rejected` and `cancelled` do not block a new request. Email matching ignores case.

A body that is not JSON returns `400`.

## Read one

```http
GET /api/enrollment-requests/enroll-001
```

`200` returns the same object shape as create, including `statusHistory`. An unknown id returns `404`.

## List

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

Every filter is optional. Filters combine with AND.

| Query | Rule |
| --- | --- |
| `status` | `pending`, `approved`, `rejected`, or `cancelled`. |
| `courseId` | Exact course id. |
| `learnerEmail` | Case-insensitive exact email. |

`200` body:

```json
{
  "items": []
}
```

An unknown query parameter, or a `status` outside the enum, returns `400`.

## Change status

```http
PATCH /api/enrollment-requests/enroll-001/status
```

Approval:

```json
{
  "status": "approved",
  "changedBy": "reviewer@example.org"
}
```

Rejection:

```json
{
  "status": "rejected",
  "changedBy": "reviewer@example.org",
  "reason": "Learner has not completed the prerequisite course."
}
```

| Field | Rule |
| --- | --- |
| `status` | Required. `pending`, `approved`, `rejected`, or `cancelled`. |
| `changedBy` | Required non-empty string. Stored with surrounding spaces removed. |
| `reason` | Required, non-empty after trimming, when `status` is `rejected`. Optional otherwise. A blank optional reason is stored as `null`. |

`200` returns the updated request. Each change appends one `statusHistory` entry. `fromStatus` is the previous status, `toStatus` is the new status, `changedAt` is the change time, `changedBy` is the caller id, and `reason` is the stored reason.

Allowed transitions:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

Any other transition returns `409`. The stored request does not change.

## Errors

Failed commands use this body:

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

| Situation | HTTP | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is not `active` | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification, status, or `changedBy` | 400 | `INVALID_REQUEST` |
| Rejection without a non-empty reason | 400 | `INVALID_REQUEST` |
| Duplicate `pending` or `approved` request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Status transition is not allowed | 409 | `INVALID_STATUS_TRANSITION` |
| Body is not a JSON object | 400 | `INVALID_REQUEST` |

## Example

```bash
curl -s -X POST https://api.agentcourses.localhost/api/enrollment-requests \
  -H 'content-type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for upcoming secure development work."}'
```
