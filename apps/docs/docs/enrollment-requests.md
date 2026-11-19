# Enrollment requests

Learners request a seat in an active course. Reviewers approve, reject, or cancel those requests. Every creation and status change is kept on the request.

## Create

```http
POST /api/enrollment-requests
Content-Type: application/json
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
| `courseId` | Required. Must be the id of a course whose status is `active`. |
| `learnerEmail` | Required. Valid email address, at most 319 characters. Compared case-insensitively for duplicates. |
| `justification` | Required. 20–500 characters after trimming. |

A new request is `pending`. The same learner cannot hold more than one `pending` or `approved` request for the same course. A `rejected` or `cancelled` request does not block a new one. A different course is a separate request.

`201` returns the request:

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

`createdAt`, `updatedAt`, and `changedAt` are ISO-8601 UTC timestamps with milliseconds. The opening history entry uses `changedBy` `system` and `reason` `null`.

## Read one

```http
GET /api/enrollment-requests/enroll-001
```

`200` returns the same object as create, including `statusHistory`.

## List

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

| Query | Rule |
| --- | --- |
| `status` | Optional. `pending`, `approved`, `rejected`, or `cancelled`. |
| `courseId` | Optional. Exact course id. |
| `learnerEmail` | Optional. Case-insensitive exact email. |

Filters combine with AND. Omitted filters are not applied. `200` returns:

```json
{
  "items": []
}
```

`items` keeps creation order. No matches is `200` with an empty array.

## Change status

```http
PATCH /api/enrollment-requests/enroll-001/status
Content-Type: application/json
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
| `changedBy` | Required non-empty reviewer or operator id. |
| `reason` | Required and non-empty when `status` is `rejected`. Optional otherwise. At most 500 characters. Stored as `null` when omitted. |

Allowed transitions:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

`200` returns the updated request. `updatedAt` matches the new history entry's `changedAt`. Earlier history entries stay in order.

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
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is not `active` | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification, status, or reason | 400 | `INVALID_REQUEST` |
| Duplicate `pending` or `approved` request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Status transition is not allowed | 409 | `INVALID_STATUS_TRANSITION` |
| Rejection without a reason | 400 | `INVALID_REQUEST` |

Invalid list filters also return `400` `INVALID_REQUEST`.

## Example

```bash
curl -s -X POST https://api.agentcourses.localhost/api/enrollment-requests \
  -H 'content-type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for upcoming secure development work."}'
```

Course search stays at `GET /api/courses`. The sample catalog used by that route is unchanged.
